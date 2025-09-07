# Coding Standards

Comprehensive coding standards for the Next.js MCP Playground project.

## Naming Conventions

### Files and Directories

- **Components**: PascalCase (e.g., `UserList.tsx`, `TaskCard.tsx`)
- **Utilities**: camelCase (e.g., `userHelpers.ts`, `dateUtils.ts`)
- **Pages**: kebab-case (e.g., `user-profile.tsx`, `task-list.tsx`)
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
2. **Internal utilities** (from `@/lib`, `@/utils`)
3. **Components** (from `@/components`)
4. **Types** (from `@/types`)
5. **Relative imports** (from `./` or `../`)

### Import Style

```typescript
// ✅ Preferred: Named imports
import { useState, useEffect } from "react";
import { getUserData, createTask } from "@/lib/api";

// ✅ Default imports for components
import UserCard from "@/components/UserCard";

// ✅ Type imports
import type { User, Task } from "@/types";

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

// ✅ Type exports
export type { User, Task, ApiResponse };
```

## TypeScript Standards

### Type Definitions

- **Always** define types for function parameters and return values
- **Use** interfaces for object shapes, types for unions/primitives
- **Prefer** explicit typing over `any`
- **Enable** strict mode in TypeScript configuration

```typescript
// ✅ Good: Explicit typing
interface UserData {
  id: string;
  name: string;
  email: string;
  tasks?: Task[];
}

const getUser = async (id: string): Promise<UserData | null> => {
  // Implementation
};

// ❌ Avoid: Any types
const getUser = async (id: any): Promise<any> => {
  // Implementation
};
```

### React Component Types

```typescript
// ✅ Functional components with proper typing
interface UserCardProps {
  user: User;
  onEdit?: (user: User) => void;
  className?: string;
}

const UserCard: React.FC<UserCardProps> = ({
  user,
  onEdit,
  className = "",
}) => {
  return (
    <div className={`user-card ${className}`}>{/* Component content */}</div>
  );
};

export default UserCard;
```

## React Conventions

### Component Structure

- **Use** functional components with hooks
- **Keep** components small and focused (< 200 lines)
- **Extract** complex logic into custom hooks
- **Use** TypeScript for all prop definitions

### Hook Usage

```typescript
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
│   ├── users/
│   ├── tasks/
├── lib/
│   ├── database/
│   ├── validations/
│   └── utils/
└── config/
```

### MCP Structure

```
mcp/
├── tools/                # MCP tools implementation
│   ├── codebase/         # File operation tools
│   ├── project/          # Project management tools
│   └── user/             # User-related tools
├── resources/            # MCP resources
├── prompts/              # AI prompts and templates
└── utils/                # MCP utilities
```

### Architecture Principles

#### Repository Pattern

- **BaseRepository**: Common CRUD operations
- **Specific Repositories**: Domain-specific data access logic
- **Interface Segregation**: Separate interfaces for each repository

#### Service Layer

- **BaseService**: Common business logic patterns
- **Domain Services**: Business rules and complex operations
- **Dependency Injection**: Services depend on repository interfaces

#### Component Organization

- **Domain-based**: Components grouped by business domain (users, tasks)
- **UI Components**: Reusable, generic UI elements
- **Feature Components**: Domain-specific, composable components

#### Hook Organization

- **CRUD Hooks**: Separate hooks for each operation (create, read, update, delete)
- **Domain Hooks**: Business logic hooks organized by domain
- **Reusable Logic**: Custom hooks for common patterns

## Code Quality Standards

### General Principles

- **Follow** SOLID principles
- **Write** descriptive variable and function names
- **Keep** functions small and focused (< 50 lines preferred)
- **Add** comments for complex business logic only
- **Use** consistent formatting (Prettier)
- **Follow** ESLint rules strictly

### Error Handling

```typescript
// ✅ Proper error handling
const getUserData = async (id: string): Promise<User | null> => {
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
// ✅ Good Tailwind usage
const UserCard = ({ user }: { user: User }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {user.name}
      </h3>
      <p className="text-gray-600 text-sm">
        {user.email}
      </p>
    </div>
  );
};

// ✅ Component classes for reused patterns
// In globals.css or component-specific CSS
.user-card-base {
  @apply bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow;
}
```

## Database and API Standards

### Prisma Usage

- **Use** descriptive model names
- **Follow** database naming conventions (snake_case for columns)
- **Implement** proper relationships
- **Use** transactions for complex operations

```typescript
// ✅ Good Prisma usage
const createUserWithTasks = async (userData: CreateUserData) => {
  return await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
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

```typescript
// ✅ Good API route structure
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
- **Check** for proper error handling
- **Verify** type safety and performance considerations
- **Ensure** proper testing coverage for new features

---

_This document should be updated as the project evolves and new patterns emerge._
