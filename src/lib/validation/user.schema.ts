import { z } from "zod";

export const idSchema = z
  .number()
  .int("ID must be an integer.")
  .positive("ID must be a positive number.");

export const emailSchema = z
  .string()
  .trim()
  .email("Please enter a valid email address.")
  .max(255, "Email must be at most 255 characters.");

export const nameSchema = z
  .string()
  .trim()
  .min(1, "Name cannot be empty.")
  .max(100, "Name must be at most 100 characters.")
  .optional();

// Schema for creating a new user
export const userCreateSchema = z.object({
  email: emailSchema,
  name: nameSchema,
});

// Schema for updating an existing user
export const userUpdateSchema = userCreateSchema.partial().extend({
  id: idSchema,
});

// Infer types from schemas for type safety
export type UserCreateInput = z.infer<typeof userCreateSchema>;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
