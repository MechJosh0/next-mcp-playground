import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { log } from "./../../utils/log";
import { UserService } from "./../../../src/services/UserService";

export const updateUserMeta: Tool = {
  name: "update_user",
  description: "Update an existing user in the database",
  inputSchema: {
    type: "object",
    properties: {
      id: {
        type: "number",
        minimum: 1,
        description: "ID of the user to update",
      },
      email: {
        type: "string",
        format: "email",
        description: "User email address (optional)",
      },
      name: {
        type: "string",
        minLength: 1,
        maxLength: 100,
        description: "User full name (optional)",
      },
    },
    required: ["id"],
    additionalProperties: false,
  },
};

export const updateUser = async function (args: {
  id: number;
  email?: string;
  name?: string;
}) {
  log("info", "Updating user", { userId: args.id });

  try {
    // Prepare input data for service
    const updateInput: any = {};
    
    if (args.email !== undefined) {
      updateInput.email = args.email;
    }
    
    if (args.name !== undefined) {
      updateInput.name = args.name;
    }

    // Create service instance
    const userService = new UserService();

    // Use UserService to update user (includes validation and business logic)
    const updatedUser = await userService.updateUser(args.id, updateInput);

    log("info", "User updated successfully", { userId: updatedUser.id });

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              success: true,
              message: `User with ID ${updatedUser.id} updated successfully`,
              user: {
                id: updatedUser.id,
                email: updatedUser.email,
                name: updatedUser.name,
                createdAt: updatedUser.createdAt,
                updatedAt: updatedUser.updatedAt,
              },
            },
            null,
            2
          ),
        },
      ],
    };
  } catch (error: any) {
    log("error", "Failed to update user", {
      error: error.message,
      userId: args.id,
    });

    // Let the error propagate naturally - the MCP tools.ts will handle it
    throw error;
  }
};
