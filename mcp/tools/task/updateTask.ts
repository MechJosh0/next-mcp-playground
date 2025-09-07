import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { Priority } from "@prisma/client";
import { log } from "./../../utils/log";
import { TaskService } from "./../../../src/services/TaskService";

export const updateTaskMeta: Tool = {
  name: "update_task",
  description: "Update an existing task in the database",
  inputSchema: {
    type: "object",
    properties: {
      id: {
        type: "number",
        minimum: 1,
        description: "ID of the task to update",
      },
      title: {
        type: "string",
        minLength: 1,
        maxLength: 255,
        description: "Task title (optional)",
      },
      description: {
        type: "string",
        maxLength: 1000,
        description: "Task description (optional)",
      },
      priority: {
        type: "string",
        enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
        description: "Task priority (optional)",
      },
      completed: {
        type: "boolean",
        description: "Task completion status (optional)",
      },
    },
    required: ["id"],
    additionalProperties: false,
  },
};

export const updateTask = async function (args: {
  id: number;
  title?: string;
  description?: string;
  priority?: keyof typeof Priority;
  completed?: boolean;
}) {
  log("info", "Updating task", { taskId: args.id });

  try {
    // Prepare input data for service
    const updateInput: any = {};
    
    if (args.title !== undefined) {
      updateInput.title = args.title;
    }
    
    if (args.description !== undefined) {
      updateInput.description = args.description;
    }
    
    if (args.priority !== undefined) {
      updateInput.priority = Priority[args.priority];
    }
    
    if (args.completed !== undefined) {
      updateInput.completed = args.completed;
    }

    // Create service instance
    const taskService = new TaskService();

    // Use TaskService to update task (includes validation and business logic)
    const updatedTask = await taskService.updateTask(args.id, updateInput);

    log("info", "Task updated successfully", { taskId: updatedTask.id });

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              success: true,
              message: `Task with ID ${updatedTask.id} updated successfully`,
              updatedTask: {
                id: updatedTask.id,
                title: updatedTask.title,
                description: updatedTask.description,
                priority: updatedTask.priority,
                completed: updatedTask.completed,
                userId: updatedTask.userId,
                createdAt: updatedTask.createdAt,
                updatedAt: updatedTask.updatedAt,
              },
            },
            null,
            2
          ),
        },
      ],
    };
  } catch (error: any) {
    log("error", "Failed to update task", {
      error: error.message,
      taskId: args.id,
    });

    // Let the error propagate naturally - the MCP tools.ts will handle it
    throw error;
  }
};
