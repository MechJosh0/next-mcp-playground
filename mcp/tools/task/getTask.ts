import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { log } from "./../../utils/log";
import { TaskService } from "./../../../src/services/TaskService";

export const getTaskMeta: Tool = {
  name: "get_task",
  description: "Get a task by ID from the database",
  inputSchema: {
    type: "object",
    properties: {
      id: {
        type: "number",
        minimum: 1,
        description: "ID of the task to retrieve",
      },
    },
    required: ["id"],
    additionalProperties: false,
  },
};

export const getTask = async function (args: {
  id: number;
}) {
  log("info", "Getting task", { taskId: args.id });

  try {
    // Create service instance
    const taskService = new TaskService();

    // Use TaskService to get task (includes validation and business logic)
    const task = await taskService.getTaskById(args.id);

    if (!task) {
      log("info", "Task not found", { taskId: args.id });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: false,
                message: `Task with ID ${args.id} not found`,
                task: null,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    log("info", "Task retrieved successfully", { taskId: task.id });

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              success: true,
              message: `Task with ID ${task.id} retrieved successfully`,
              task: {
                id: task.id,
                title: task.title,
                description: task.description,
                priority: task.priority,
                completed: task.completed,
                userId: task.userId,
                createdAt: task.createdAt,
                updatedAt: task.updatedAt,
                user: task.user,
              },
            },
            null,
            2
          ),
        },
      ],
    };
  } catch (error: any) {
    log("error", "Failed to get task", {
      error: error.message,
      taskId: args.id,
    });

    // Let the error propagate naturally - the MCP tools.ts will handle it
    throw error;
  }
};
