import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { log } from "./../../utils/log";
import { UserService } from "./../../../src/services/UserService";

export const listUsersMeta: Tool = {
  name: "list_users",
  description: "List all users or search users by name/email",
  inputSchema: {
    type: "object",
    properties: {
      search: {
        type: "string",
        description: "Search term to filter users by name or email (optional)",
      },
      withTaskCounts: {
        type: "boolean",
        description: "Include task counts for each user (optional, default: false)",
      },
    },
    additionalProperties: false,
  },
};

export const listUsers = async function (args: {
  search?: string;
  withTaskCounts?: boolean;
}) {
  log("info", "Listing users", { search: args.search, withTaskCounts: args.withTaskCounts });

  try {
    // Create service instance
    const userService = new UserService();

    let users;
    let message;

    if (args.search) {
      // Search users by name/email
      users = await userService.searchUsersByName(args.search);
      message = `Found ${users.length} users matching "${args.search}"`;
    } else if (args.withTaskCounts) {
      // Get all users with task counts
      users = await userService.getUsersWithTaskCounts();
      message = `Retrieved ${users.length} users with task counts`;
    } else {
      // Get all users
      users = await userService.getAllUsers();
      message = `Retrieved ${users.length} users`;
    }

    log("info", "Users retrieved successfully", { 
      count: users.length, 
      search: args.search,
      withTaskCounts: args.withTaskCounts 
    });

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              success: true,
              message,
              count: users.length,
              users: users.map(user => ({
                id: user.id,
                email: user.email,
                name: user.name,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
                ...('_count' in user && { taskCount: user._count.tasks }),
                ...(args.withTaskCounts || args.search ? {} : { tasks: user.tasks }),
              })),
            },
            null,
            2
          ),
        },
      ],
    };
  } catch (error: any) {
    log("error", "Failed to list users", {
      error: error.message,
      search: args.search,
      withTaskCounts: args.withTaskCounts,
    });

    // Let the error propagate naturally - the MCP tools.ts will handle it
    throw error;
  }
};
