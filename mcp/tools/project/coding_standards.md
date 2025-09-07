# Coding Standards

Comprehensive coding standards for the Next.js MCP Playground project.

## Core Development Principles

### Code Philosophy

- **Keep it simple**: Solve the exact problem without over-engineering
- **Small and focused**: Write small functions and modules that do one thing well
- **Let errors throw naturally**: Don't catch errors in services/repositories - let Sentry pick them up and frontend handle API errors
- **TypeScript throughout**: Use TypeScript for type safety but rely on inference as much as possible. Use types from `@prisma/client` that align with database tables
- **Follow CRUD/SOLID**: Implement clean architecture with clear separation of concerns

### Error Handling Strategy

```typescript
// ✅ Good: Let errors throw naturally in services/repositories
export class TaskService {
  async createTask(data: CreateTaskData): Promise<Task> {
    if (!data.title?.trim()) {
      throw new Error("Task title is required"); // Let this throw naturally
    }

    return await this.taskRepository.create(data); // Let database errors throw
  }
}

// ✅ Good: Handle errors at the API/frontend boundary
export async function POST(request: Request) {
  try {
    const task = await taskService.createTask(data);
    return NextResponse.json(task);
  } catch (error) {
    // Handle errors here for proper API responses
    console.error("API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ❌ Avoid: Catching errors in services/repositories
export class TaskService {
  async createTask(data: CreateTaskData): Promise<Task | null> {
    try {
      return await this.taskRepository.create(data);
    } catch (error) {
      console.error(error); // Don't do this - let it throw
      return null;
    }
  }
}
```

### TypeScript Usage

- **Rely on TypeScript inference** whenever possible
- **Use Prisma-generated types** from `@prisma/client` for database entities
- **Use explicit types only when inference fails** or for complex public interfaces
- **Import types from `@prisma/client`** to align with database schema

```typescript
import { Task, User, Priority } from '@prisma/client';

// ✅ Good: Let TypeScript infer simple types, use Prisma types
const createTask = async (title: string, userId: number) => {
  return await taskRepository.create({ title, userId }); // Returns Task from Prisma
};

// ✅ Good: Use Prisma types for database entities
const getUserTasks = async (userId: number): Promise<Task[]> => {
  return await taskRepository.findByUserId(userId);
};

// ✅ Good: Explicit types only when needed for complex data
type CreateTaskData = {
  title: string;
  description?: string;
  priority?: Priority; // From Prisma enum
  userId: number;
};

// ❌ Avoid: Over-defining simple interfaces when inference works
interface CreateTaskParams {
  title: string;
  userId: number;
}
const createTask = async (params: CreateTaskParams) => { ... }
```

## Schema Validation with Zod

### Schema Organization and Structure

All input validation should be handled using Zod schemas that both validate data and provide type inference. Organize schemas by domain with reusable base schemas.

#### Schema File Structure

```
src/lib/validation/
├── shared.schema.ts         # Common reusable schemas
├── account.schema.ts        # Authentication-related schemas
├── user.schema.ts          # User-related schemas
├── task.schema.ts          # Task-related schemas
└── index.ts                # Re-export all schemas
```

#### Base Schema Patterns

```typescript
// src/lib/validation/shared.schema.ts
import { z } from "zod";

export const firstNameSchema = z
  .string()
  .trim()
  .min(2, "Please enter at least 2 characters.")
  .max(50, "Please enter at most 50 characters.");

export const lastNameSchema = z
  .string()
  .trim()
  .min(2, "Please enter at least 2 characters.")
  .max(50, "Please enter at most 50 characters.");

export const emailSchema = z
  .string()
  .trim()
  .email("Enter a valid e-mail address.");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .regex(/[A-Z]/, "Add at least one capital letter.")
  .regex(/[0-9]/, "Add at least one number.");
```

#### Domain-Specific Schemas

```typescript
// src/lib/validation/account.schema.ts
import { z } from "zod";
import { emailSchema, passwordSchema } from "./shared.schema";

export const userCreateSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const userLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required."),
});

// Infer types from schemas
export type UserCreateInput = z.infer<typeof userCreateSchema>;
export type UserLoginInput = z.infer<typeof userLoginSchema>;
```

```typescript
// src/lib/validation/task.schema.ts
import { z } from "zod";
import { Priority } from "@prisma/client";

export const taskCreateSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Task title is required.")
    .max(255, "Title too long."),
  description: z.string().trim().optional(),
  priority: z.nativeEnum(Priority).default(Priority.MEDIUM),
  userId: z.number().int().positive("Valid user ID required."),
});

export const taskUpdateSchema = taskCreateSchema.partial().extend({
  id: z.number().int().positive("Valid task ID required."),
});

export type TaskCreateInput = z.infer<typeof taskCreateSchema>;
export type TaskUpdateInput = z.infer<typeof taskUpdateSchema>;
```

### Integration with CRUD Operations

#### Repository Layer Validation

```typescript
// src/repositories/TaskRepository.ts
import { Task, PrismaClient } from "@prisma/client";
import {
  taskCreateSchema,
  TaskCreateInput,
} from "@/lib/validation/task.schema";

export class TaskRepository {
  constructor(private prisma: PrismaClient) {}

  async create(input: TaskCreateInput): Promise<Task> {
    // Validate input with Zod schema
    const validatedData = taskCreateSchema.parse(input);

    return await this.prisma.task.create({
      data: validatedData,
    });
  }

  async update(id: number, input: Partial<TaskCreateInput>): Promise<Task> {
    const validatedData = taskUpdateSchema.parse({ ...input, id });

    return await this.prisma.task.update({
      where: { id: validatedData.id },
      data: validatedData,
    });
  }
}
```

#### Service Layer Usage

```typescript
// src/services/TaskService.ts
import { TaskRepository } from "@/repositories/TaskRepository";
import { TaskCreateInput, TaskUpdateInput } from "@/lib/validation/task.schema";

export class TaskService {
  constructor(private taskRepository: TaskRepository) {}

  async createTask(input: TaskCreateInput): Promise<Task> {
    // Additional business logic validation if needed
    if (await this.isDuplicateTitle(input.title, input.userId)) {
      throw new Error("Task with this title already exists");
    }

    // Repository handles Zod validation
    return await this.taskRepository.create(input);
  }

  async updateTask(id: number, input: Partial<TaskCreateInput>): Promise<Task> {
    return await this.taskRepository.update(id, input);
  }
}
```

#### API Route Validation

```typescript
// src/app/api/tasks/route.ts
import { NextRequest, NextResponse } from "next/server";
import { taskCreateSchema } from "@/lib/validation/task.schema";
import { TaskService } from "@/services/TaskService";
import { ZodError } from "zod";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body with Zod
    const validatedInput = taskCreateSchema.parse(body);

    const taskService = new TaskService(taskRepository);
    const task = await taskService.createTask(validatedInput);

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

#### MCP Tool Integration

```typescript
// mcp/tools/task/create-task.ts
import { z } from "zod";
import {
  taskCreateSchema,
  TaskCreateInput,
} from "@/lib/validation/task.schema";
import { TaskService } from "@/services/TaskService";

// Define MCP tool schema based on Zod schema
const createTaskToolSchema = taskCreateSchema.extend({
  // Add any tool-specific fields if needed
});

export const createTask = async function (args: TaskCreateInput) {
  // Validate MCP tool arguments
  const validatedArgs = createTaskToolSchema.parse(args);

  const taskService = new TaskService(taskRepository);
  const task = await taskService.createTask(validatedArgs);

  return {
    content: [{ type: "text", text: JSON.stringify({ task }) }],
  };
};
```

### Schema Validation Best Practices

#### Error Message Standards

```typescript
// ✅ Good: Descriptive, user-friendly error messages
export const emailSchema = z
  .string()
  .trim()
  .email("Please enter a valid email address.");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long.")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
  .regex(/[0-9]/, "Password must contain at least one number.");

// ❌ Avoid: Generic or technical error messages
export const emailSchema = z.string().email(); // Uses default Zod message
export const passwordSchema = z.string().min(8).regex(/[A-Z]/);
```

#### Schema Composition and Reusability

```typescript
// ✅ Good: Compose complex schemas from simpler ones
const baseUserSchema = z.object({
  email: emailSchema,
  firstName: firstNameSchema,
  lastName: lastNameSchema,
});

export const userCreateSchema = baseUserSchema.extend({
  password: passwordSchema,
});

export const userUpdateSchema = baseUserSchema.partial();

export const userProfileSchema = baseUserSchema.extend({
  id: z.number().int().positive(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
```

#### Type Safety with Schema Inference

```typescript
// ✅ Good: Always infer types from schemas
export type UserCreateInput = z.infer<typeof userCreateSchema>;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
export type UserProfile = z.infer<typeof userProfileSchema>;

// Use inferred types in function signatures
const createUser = async (input: UserCreateInput): Promise<User> => {
  // Type safety guaranteed by Zod schema
  const validatedInput = userCreateSchema.parse(input);
  return await userRepository.create(validatedInput);
};

// ❌ Avoid: Manual interface definitions that can drift from schemas
interface ManualUserCreateInput {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
}
```

## Architecture Patterns

### Repository Pattern

```typescript
import { Task, PrismaClient } from "@prisma/client";

// ✅ Simple, focused repository using Prisma types
export class TaskRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: CreateTaskData): Promise<Task> {
    return await this.prisma.task.create({ data });
  }

  async findById(id: number): Promise<Task | null> {
    return await this.prisma.task.findUnique({ where: { id } });
  }
}
```

### Service Pattern

```typescript
// ✅ Business logic in services, let errors throw
export class TaskService {
  constructor(private taskRepository: TaskRepository) {}

  async createTask(data: CreateTaskData): Promise<Task> {
    if (!data.title?.trim()) {
      throw new Error("Task title is required");
    }

    return await this.taskRepository.create(data);
  }
}
```

### MCP Tool Pattern

```typescript
// ✅ Use services in MCP tools for consistency
export const createTask = async function (args: CreateTaskArgs) {
  const taskRepository = new TaskRepository(db);
  const taskService = new TaskService(taskRepository);

  const task = await taskService.createTask(args);

  return {
    content: [{ type: "text", text: JSON.stringify({ task }) }],
  };
};
```

## File Organization

### SOLID & CRUD Architecture Structure

Following Next.js recommendations with SOLID principles and CRUD operations:

```
src/
├── types/
├── interfaces/
│   ├── repositories/
│   └── services/
├── repositories/
├── services/
├── hooks/
│   ├── users/
│   ├── tasks/
│   └── assignments/
├── components/
│   ├── ui/
│   ├── forms/
│   ├── users/
│   ├── tasks/
│   └── assignments/
├── pages/
│   ├── api/
│   │   ├── users/
│   │   ├── tasks/
│   │   └── assignments/
│   ├── users/
│   ├── tasks/
│   └── assignments/
├── lib/
│   ├── database/
│   ├── validation/      # Zod schemas organized by domain
│   └── utils/
└── config/
```

### MCP Structure

```
mcp/
├── tools/                # MCP tools implementation
│   ├── codebase/         # File operation tools
│   ├── project/          # Project management tools
│   ├── user/             # User-related tools
│   └── task/             # Task-related tools
├── resources/            # MCP resources
├── prompts/              # AI prompts and templates
└── utils/                # MCP utilities
```

### Architecture Principles

#### Repository Pattern

- **Simple data access**: Direct Prisma operations without unnecessary abstraction
- **Let errors throw**: Don't catch database errors, let them propagate
- **Focused responsibility**: Each repository handles one entity
- **Use Prisma types**: Import and use types from `@prisma/client`

#### Service Layer

- **Business logic only**: Validation, business rules, and orchestration
- **Natural error handling**: Throw meaningful errors, don't catch
- **Dependency injection**: Services depend on repositories

#### Component Organization

- **Domain-based**: Components grouped by business domain (users, tasks)
- **UI Components**: Reusable, generic UI elements
- **Feature Components**: Domain-specific, composable components

#### Hook Organization

- **CRUD Hooks**: Separate hooks for each operation (create, read, update, delete)
- **Domain Hooks**: Business logic hooks organized by domain
- **Reusable Logic**: Custom hooks for common patterns

## Naming Conventions

### Files and Directories

- **Components**: PascalCase (e.g., `UserList.tsx`, `TaskCard.tsx`)
- **Utilities**: camelCase (e.g., `userHelpers.ts`, `dateUtils.ts`)
- **Pages**: Follow Next.js conventions (e.g., `[id].tsx`, `index.tsx`)
- **Directories**: kebab-case (e.g., `user-management/`, `task-components/`)

### Variables and Functions

- **Variables**: camelCase (e.g., `userName`, `taskCount`, `isCompleted`)
- **Functions**: camelCase (e.g., `getUserData`, `createTask`, `validateInput`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_BASE_URL`, `MAX_RETRY_COUNT`)
- **Boolean variables**: Use descriptive prefixes (e.g., `isLoading`, `hasPermission`, `canEdit`)

### Classes and Interfaces

- **Classes**: PascalCase (e.g., `UserService`, `TaskManager`, `DatabaseConnection`)
- **Interfaces**: PascalCase with descriptive names (e.g., `UserData`, `TaskResponse`, `ApiConfig`)
- **Types**: PascalCase (e.g., `UserRole`, `TaskStatus`, `ApiResponse`)
- **Enums**: PascalCase with descriptive values (e.g., `TaskPriority.HIGH`, `UserRole.ADMIN`)

## Import and Export Standards

### Import Order

1. **Node modules** (React, Next.js, external packages)
2. **Prisma types** (from `@prisma/client`)
3. **Internal utilities** (from `@/lib`, `@/utils`)
4. **Components** (from `@/components`)
5. **Types** (from `@/types`)
6. **Relative imports** (from `./` or `../`)

### Import Style

```typescript
// ✅ Preferred: Named imports
import { useState, useEffect } from "react";
import { Task, User, Priority } from "@prisma/client";
import { getUserData, createTask } from "@/lib/api";

// ✅ Default imports for components
import UserCard from "@/components/UserCard";

// ✅ Type imports when needed
import type { ApiResponse } from "@/types";

// ❌ Avoid: Wildcard imports (except for specific cases)
import * as React from "react"; // Only when necessary
```

### Export Style

```typescript
// ✅ Preferred: Named exports
export const getUserData = async (id: string) => { ... };
export const validateUser = (user: User) => { ... };

// ✅ Default exports for components
const UserCard: React.FC<UserCardProps> = ({ user }) => { ... };
export default UserCard;

// ✅ Type exports when creating custom types
export type { ApiResponse };
```

## React Conventions

### Component Structure

- **Use** functional components with hooks
- **Keep** components small and focused (< 200 lines)
- **Extract** complex logic into custom hooks
- **Use** TypeScript but rely on inference for props when possible

### Hook Usage

```typescript
import { User } from "@prisma/client";

// ✅ Custom hooks for reusable logic
const useUserData = (userId: string) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Hook implementation

  return { user, loading, error, refetch };
};

// ✅ Use in components
const UserProfile = ({ userId }: { userId: string }) => {
  const { user, loading, error } = useUserData(userId);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return <div>{/* Component content */}</div>;
};
```

### State Management

- **Use** `useState` for local component state
- **Use** `useReducer` for complex state logic
- **Consider** context for global state (avoid prop drilling)
- **Keep** state as close to where it's used as possible

## Code Quality Standards

### General Principles

- **Follow** SOLID principles
- **Write** descriptive variable and function names
- **Keep** functions small and focused (< 50 lines preferred)
- **Add** comments for complex business logic only
- **Use** consistent formatting (Prettier)
- **Follow** ESLint rules strictly

### Error Handling Boundaries

- **Services/Repositories**: Always let errors throw naturally
- **API Routes**: Always catch and handle errors for proper HTTP responses
- **Frontend Components**: Handle API errors appropriately with user-friendly messages

```typescript
// ✅ Proper error handling at boundaries
const getUserData = async (id: string): Promise<User | null> => {
  // This is an API call, so handle errors
  try {
    const response = await fetch(`/api/users/${id}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch user: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching user:", error);
    throw error; // Re-throw for caller to handle
  }
};

// ✅ Component error boundaries
const UserProfile = ({ userId }: { userId: string }) => {
  const [error, setError] = useState<string | null>(null);

  const handleError = (error: Error) => {
    setError(error.message);
    // Log error for monitoring
    console.error("UserProfile error:", error);
  };

  // Component implementation with error handling
};
```

### Performance Considerations

- **Use** `React.memo` for expensive components
- **Implement** proper loading states
- **Use** `useMemo` and `useCallback` judiciously
- **Optimize** database queries with proper indexing
- **Implement** pagination for large data sets

## Styling Standards

### Tailwind CSS Usage

- **Use** utility classes for styling
- **Create** component classes for repeated patterns
- **Follow** responsive design principles
- **Use** semantic color names in Tailwind config

```typescript
import { User } from "@prisma/client";

// ✅ Good Tailwind usage
const UserCard = ({ user }: { user: User }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{user.name}</h3>
      <p className="text-gray-600 text-sm">{user.email}</p>
    </div>
  );
};
```

## Database and API Standards

### Prisma Usage

- **Use** descriptive model names
- **Follow** database naming conventions (snake_case for columns)
- **Implement** proper relationships
- **Use** transactions for complex operations
- **Import types from `@prisma/client`**

```typescript
import { User, Task } from "@prisma/client";

// ✅ Good Prisma usage with proper types
const createUserWithTasks = async (userData: CreateUserData) => {
  return await prisma.$transaction(async (tx) => {
    const user: User = await tx.user.create({
      data: {
        email: userData.email,
        name: userData.name,
      },
    });

    if (userData.initialTasks?.length) {
      await tx.task.createMany({
        data: userData.initialTasks.map((task) => ({
          ...task,
          userId: user.id,
        })),
      });
    }

    return user;
  });
};
```

### API Route Standards

- **Use** proper HTTP methods (GET, POST, PUT, DELETE)
- **Implement** proper error responses
- **Validate** input data
- **Use** consistent response formats
- **Follow** Next.js conventions for file naming

```typescript
// ✅ Good API route structure following Next.js conventions
// File: pages/api/users/[id].ts
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserById(params.id);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

## Testing Standards

### Test Organization

- **Co-locate** tests with source files or use `__tests__` directories
- **Use** descriptive test names
- **Follow** AAA pattern (Arrange, Act, Assert)
- **Mock** external dependencies

### Test Naming

```typescript
// ✅ Descriptive test names
describe("UserService", () => {
  describe("getUserById", () => {
    it("should return user data when user exists", async () => {
      // Test implementation
    });

    it("should return null when user does not exist", async () => {
      // Test implementation
    });

    it("should throw error when database connection fails", async () => {
      // Test implementation
    });
  });
});
```

## Commit and Documentation Standards

### Commit Messages

- **Use** conventional commit format
- **Write** clear, descriptive commit messages
- **Include** breaking change notes when applicable

```
feat(user): add user profile editing functionality
fix(api): resolve user creation validation error
docs(readme): update installation instructions
refactor(components): extract common button styles
```

### Code Documentation

- **Document** complex algorithms and business logic
- **Use** JSDoc for public APIs
- **Keep** README files up to date
- **Document** environment setup and deployment processes

## Enforcement

### Automated Tools

- **ESLint**: Enforces code quality and style rules
- **Prettier**: Ensures consistent code formatting
- **TypeScript**: Provides type safety and compile-time checks
- **Husky**: Runs pre-commit hooks for quality checks

### Code Review Guidelines

- **Review** for adherence to these standards
- **Check** for proper error handling boundaries
- **Verify** Zod schema validation in CRUD operations and API routes
- **Confirm** type inference from Zod schemas rather than manual interfaces
- **Verify** type safety and performance considerations
- **Ensure** proper testing coverage for new features
- **Confirm** usage of Prisma types over custom interfaces

---

_This document should be updated as the project evolves and new patterns emerge._
