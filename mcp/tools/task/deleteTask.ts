import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { log } from "./../../utils/log";
import { TaskService } from "./../../../src/services/TaskService";

export const deleteTaskMeta: Tool = {
  name: "delete_task",
  description: "Delete a task from the database",
  inputSchema: {
    type: "object",
    properties: {
      id: {
        type: "number",
        minimum: 1,
        description: "ID of the task to delete",
      },
    },
    required: ["id"],
    additionalProperties: false,
  },
};

export const deleteTask = async function (args: {
  id: number;
}) {
  log("info", "Deleting task", { taskId: args.id });

  try {
    // Create service instance
    const taskService = new TaskService();

    // Use TaskService to delete task (includes validation and business logic)
    const deletedTask = await taskService.deleteTask(args.id);

    log("info", "Task deleted successfully", { taskId: deletedTask.id });

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              success: true,
              message: `Task with ID ${deletedTask.id} deleted successfully`,
              deletedTask: {
                id: deletedTask.id,
                title: deletedTask.title,
                description: deletedTask.description,
                priority: deletedTask.priority,
                completed: deletedTask.completed,
                userId: deletedTask.userId,
                createdAt: deletedTask.createdAt,
                updatedAt: deletedTask.updatedAt,
              },
            },
            null,
            2
          ),
        },
      ],
    };
  } catch (error: any) {
    log("error", "Failed to delete task", {
      error: error.message,
      taskId: args.id,
    });

    // Let the error propagate naturally - the MCP tools.ts will handle it
    throw error;
  }
};
