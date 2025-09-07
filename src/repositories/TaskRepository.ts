import { PrismaClient } from "@prisma/client";
import {
  taskCreateSchema,
  TaskCreateInput,
} from "@/lib/validation/task.schema";
import { db } from "@/lib/server/prisma";

export class TaskRepository {
  constructor(private prisma: PrismaClient = db) {}

  async create(input: TaskCreateInput) {
    const validatedData = taskCreateSchema.parse(input);

    return this.prisma.task.create({
      select: { id: true },
      data: {
        title: validatedData.title,
        description: validatedData.description,
        priority: validatedData.priority,
        userId: validatedData.userId,
      },
    });
  }
}
