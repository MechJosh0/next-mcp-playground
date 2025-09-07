import { PrismaClient, Task } from "@prisma/client";
import {
  taskCreateSchema,
  taskUpdateSchema,
  TaskCreateInput,
  TaskUpdateInput,
} from "@/lib/validation/task.schema";
import { db } from "@/lib/server/prisma";

export class TaskRepository {
  constructor(private prisma: PrismaClient = db) {}

  async create(input: TaskCreateInput): Promise<Task> {
    const validatedData = taskCreateSchema.parse(input);

    return this.prisma.task.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        priority: validatedData.priority,
        userId: validatedData.userId,
      },
    });
  }

  async findById(id: number): Promise<Task | null> {
    return this.prisma.task.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async findByUserId(userId: number): Promise<Task[]> {
    return this.prisma.task.findMany({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async findAll(): Promise<Task[]> {
    return this.prisma.task.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async update(id: number, input: Partial<TaskCreateInput>): Promise<Task> {
    const validatedData = taskUpdateSchema.parse({ ...input, id });

    return this.prisma.task.update({
      where: { id: validatedData.id },
      data: {
        title: validatedData.title,
        description: validatedData.description,
        priority: validatedData.priority,
        completed: validatedData.completed,
      },
    });
  }

  async delete(id: number): Promise<Task> {
    return this.prisma.task.delete({
      where: { id },
    });
  }

  async markAsCompleted(id: number): Promise<Task> {
    return this.prisma.task.update({
      where: { id },
      data: { completed: true },
    });
  }

  async markAsIncomplete(id: number): Promise<Task> {
    return this.prisma.task.update({
      where: { id },
      data: { completed: false },
    });
  }
}
