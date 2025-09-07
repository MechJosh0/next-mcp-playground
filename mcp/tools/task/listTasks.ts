import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { log } from "./../../utils/log";
import { TaskService } from "./../../../src/services/TaskService";

export const listTasksMeta: Tool = {
  name: "list_tasks",
  description: "List all tasks or tasks for a specific user",
  inputSchema: {
    type: "object",
    properties: {
      userId: {
        type: "number",
        minimum: 1,
        description: "ID of the user to get tasks for (optional, if not provided returns all tasks)",
      },
    },
    additionalProperties: false,
  },
};

export const listTasks = async function (args: {
  userId?: number;
}) {
  log("info", "Listing tasks", { userId: args.userId });

  try {
    // Create service instance
    const taskService = new TaskService();

    let tasks;
    let message;

    if (args.userId) {
      // Get tasks for specific user
      tasks = await taskService.getTasksByUserId(args.userId);
      message = `Retrieved ${tasks.length} tasks for user ${args.userId}`;
    } else {
      // Get all tasks
      tasks = await taskService.getAllTasks();
      message = `Retrieved ${tasks.length} tasks`;
    }

    log("info", "Tasks retrieved successfully", { count: tasks.length, userId: args.userId });

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              success: true,
              message,
              count: tasks.length,
              tasks: tasks.map(task => ({
                id: task.id,
                title: task.title,
                description: task.description,
                priority: task.priority,
                completed: task.completed,
                userId: task.userId,
                createdAt: task.createdAt,
                updatedAt: task.updatedAt,
                user: task.user,
              })),
            },
            null,
            2
          ),
        },
      ],
    };
  } catch (error: any) {
    log("error", "Failed to list tasks", {
      error: error.message,
      userId: args.userId,
    });

    // Let the error propagate naturally - the MCP tools.ts will handle it
    throw error;
  }
};
