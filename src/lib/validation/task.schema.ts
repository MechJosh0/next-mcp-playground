import { z } from "zod";
import { Priority } from "@prisma/client";

export const idSchema = z
  .number()
  .int("ID must be an integer.")
  .positive("ID must be a positive number.");

export const titleSchema = z
  .string()
  .trim()
  .min(1, "Title is required.")
  .max(255, "Title must be at most 255 characters.");

export const descriptionSchema = z.string().trim().optional();

export const userIdSchema = z
  .number()
  .int("User ID must be an integer.")
  .positive("Valid user ID is required.");

export const prioritySchema = z.enum(Priority).default(Priority.MEDIUM);

// Schema for creating a new task
export const taskCreateSchema = z.object({
  title: titleSchema,
  description: descriptionSchema,
  priority: prioritySchema,
  userId: userIdSchema,
});

// Schema for updating an existing task
export const taskUpdateSchema = taskCreateSchema.partial().extend({
  id: idSchema,
  completed: z.boolean().optional(),
});

// Infer types from schemas for type safety
export type TaskCreateInput = z.infer<typeof taskCreateSchema>;
export type TaskUpdateInput = z.infer<typeof taskUpdateSchema>;
