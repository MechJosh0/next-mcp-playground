import { Task } from "@prisma/client";
import { TaskRepository } from "@/repositories/TaskRepository";
import { TaskCreateInput, TaskUpdateInput } from "@/lib/validation/task.schema";

export class TaskService {
  constructor(private taskRepository: TaskRepository = new TaskRepository()) {}

  async createTask(input: TaskCreateInput): Promise<Task> {
    return this.taskRepository.create(input);
  }

  async getTaskById(id: number): Promise<Task | null> {
    if (id <= 0) {
      throw new Error("Invalid task ID");
    }

    return this.taskRepository.findById(id);
  }

  async getTasksByUserId(userId: number): Promise<Task[]> {
    return this.taskRepository.findByUserId(userId);
  }

  async getAllTasks(): Promise<Task[]> {
    return this.taskRepository.findAll();
  }

  async updateTask(id: number, input: Partial<TaskCreateInput>): Promise<Task> {
    const existingTask = await this.taskRepository.findById(id);

    if (!existingTask) {
      throw new Error("Task not found");
    }

    return this.taskRepository.update(id, input);
  }

  async deleteTask(id: number): Promise<Task> {
    const existingTask = await this.taskRepository.findById(id);

    if (!existingTask) {
      throw new Error("Task not found");
    }

    return this.taskRepository.delete(id);
  }

  async completeTask(id: number): Promise<Task> {
    const existingTask = await this.taskRepository.findById(id);

    if (!existingTask) {
      throw new Error("Task not found");
    }

    if (existingTask.completed) {
      throw new Error("Task is already completed");
    }

    return this.taskRepository.markAsCompleted(id);
  }

  async uncompleteTask(id: number): Promise<Task> {
    const existingTask = await this.taskRepository.findById(id);

    if (!existingTask) {
      throw new Error("Task not found");
    }

    if (!existingTask.completed) {
      throw new Error("Task is already incomplete");
    }

    return this.taskRepository.markAsIncomplete(id);
  }
}
