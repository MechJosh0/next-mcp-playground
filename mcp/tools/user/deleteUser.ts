import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { log } from "./../../utils/log";
import { UserService } from "./../../../src/services/UserService";

export const deleteUserMeta: Tool = {
  name: "delete_user",
  description: "Delete a user from the database",
  inputSchema: {
    type: "object",
    properties: {
      id: {
        type: "number",
        minimum: 1,
        description: "ID of the user to delete",
      },
    },
    required: ["id"],
    additionalProperties: false,
  },
};

export const deleteUser = async function (args: {
  id: number;
}) {
  log("info", "Deleting user", { userId: args.id });

  try {
    // Create service instance
    const userService = new UserService();

    // Use UserService to delete user (includes validation and business logic)
    const deletedUser = await userService.deleteUser(args.id);

    log("info", "User deleted successfully", { userId: deletedUser.id });

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              success: true,
              message: `User with ID ${deletedUser.id} deleted successfully`,
              deletedUser: {
                id: deletedUser.id,
                email: deletedUser.email,
                name: deletedUser.name,
                createdAt: deletedUser.createdAt,
                updatedAt: deletedUser.updatedAt,
              },
            },
            null,
            2
          ),
        },
      ],
    };
  } catch (error: any) {
    log("error", "Failed to delete user", {
      error: error.message,
      userId: args.id,
    });

    // Let the error propagate naturally - the MCP tools.ts will handle it
    throw error;
  }
};
