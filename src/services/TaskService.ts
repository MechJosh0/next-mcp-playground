import { Task } from "@prisma/client";
import { TaskRepository } from "@/repositories/TaskRepository";
import { TaskCreateInput } from "@/lib/validation/task.schema";

export class TaskService {
  constructor(private taskRepository: TaskRepository = new TaskRepository()) {}

  async createTask(input: TaskCreateInput) {
    return this.taskRepository.create(input);
  }
}
