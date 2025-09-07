import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { Priority } from "@prisma/client";
import { log } from "./../../utils/log";
import { TaskService } from "./../../../src/services/TaskService";
import { TaskCreateInput } from "./../../../src/lib/validation/task.schema";

export const createTaskMeta: Tool = {
  name: "create_task",
  description: "Create a new task in the database",
  inputSchema: {
    type: "object",
    properties: {
      title: {
        type: "string",
        minLength: 1,
        maxLength: 255,
        description: "Task title",
      },
      description: {
        type: "string",
        maxLength: 1000,
        description: "Task description (optional)",
      },
      priority: {
        type: "string",
        enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
        description: "Task priority (default: MEDIUM)",
      },
      userId: {
        type: "number",
        minimum: 1,
        description: "ID of the user to assign the task to",
      },
    },
    required: ["title", "userId"],
    additionalProperties: false,
  },
};

export const createTask = async function (args: {
  title: string;
  description?: string;
  priority?: keyof typeof Priority;
  userId: number;
}) {
  log("info", "Creating new task", { title: args.title, userId: args.userId });

  try {
    // Prepare input data for service
    const taskInput: TaskCreateInput = {
      title: args.title,
      description: args.description,
      priority: args.priority ? Priority[args.priority] : Priority.MEDIUM,
      userId: args.userId,
    };

    // Create service instances
    const taskService = new TaskService();

    // Use TaskService to create task (includes validation and business logic)
    const task = await taskService.createTask(taskInput);

    log("info", "Task created successfully", { taskId: task.id });

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              success: true,
              message: `Task created successfully with ID: "${task.id}"`,
              task: {
                id: task.id,
                title: taskInput.title,
                description: taskInput.description,
                priority: taskInput.priority,
                userId: taskInput.userId,
              },
            },
            null,
            2
          ),
        },
      ],
    };
  } catch (error: any) {
    log("error", "Failed to create task", {
      error: error.message,
      title: args.title,
      userId: args.userId,
    });

    // Let the error propagate naturally - the MCP tools.ts will handle it
    throw error;
  }
};
