import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { log } from "./../../utils/log";
import { UserService } from "./../../../src/services/UserService";
import { UserCreateInput } from "./../../../src/lib/validation/user.schema";

export const userCreateMeta: Tool = {
  name: "create_user",
  description: "Create a new user in the database",
  inputSchema: {
    type: "object",
    properties: {
      email: {
        type: "string",
        format: "email",
        description: "User email address",
      },
      name: {
        type: "string",
        minLength: 1,
        maxLength: 100,
        description: "User full name",
      },
    },
    required: ["email"],
    additionalProperties: false,
  },
};

export const userCreate = async function (args: {
  email: string;
  name?: string;
}) {
  log("info", "Creating new user", { email: args.email });

  try {
    // Prepare input data for service
    const userInput: UserCreateInput = {
      email: args.email,
      name: args.name,
    };

    // Create service instance
    const userService = new UserService();

    // Use UserService to create user (includes validation and business logic)
    const user = await userService.createUser(userInput);

    log("info", "User created successfully", { userId: user.id, email: user.email });

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              success: true,
              message: `User created successfully with ID: ${user.id}`,
              user: {
                id: user.id,
                email: user.email,
                name: user.name,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
              },
            },
            null,
            2
          ),
        },
      ],
    };
  } catch (error: any) {
    log("error", "Failed to create user", {
      error: error.message,
      email: args.email,
    });

    // Let the error propagate naturally - the MCP tools.ts will handle it
    throw error;
  }
};
