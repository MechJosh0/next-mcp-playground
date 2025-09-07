import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { log } from "./../../utils/log";
import { UserService } from "./../../../src/services/UserService";

export const getUserMeta: Tool = {
  name: "get_user",
  description: "Get a user by ID or email from the database",
  inputSchema: {
    type: "object",
    properties: {
      id: {
        type: "number",
        minimum: 1,
        description: "ID of the user to retrieve",
      },
      email: {
        type: "string",
        format: "email",
        description: "Email of the user to retrieve",
      },
    },
    additionalProperties: false,
  },
};

export const getUser = async function (args: {
  id?: number;
  email?: string;
}) {
  log("info", "Getting user", { userId: args.id, email: args.email });

  try {
    if (!args.id && !args.email) {
      throw new Error("Either id or email must be provided");
    }

    if (args.id && args.email) {
      throw new Error("Provide either id or email, not both");
    }

    // Create service instance
    const userService = new UserService();

    let user;
    if (args.id) {
      user = await userService.getUserById(args.id);
    } else if (args.email) {
      user = await userService.getUserByEmail(args.email);
    }

    if (!user) {
      const identifier = args.id ? `ID ${args.id}` : `email ${args.email}`;
      log("info", "User not found", { userId: args.id, email: args.email });
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: false,
                message: `User with ${identifier} not found`,
                user: null,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    log("info", "User retrieved successfully", { userId: user.id });

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              success: true,
              message: `User with ID ${user.id} retrieved successfully`,
              user: {
                id: user.id,
                email: user.email,
                name: user.name,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
                tasks: user.tasks,
              },
            },
            null,
            2
          ),
        },
      ],
    };
  } catch (error: any) {
    log("error", "Failed to get user", {
      error: error.message,
      userId: args.id,
      email: args.email,
    });

    // Let the error propagate naturally - the MCP tools.ts will handle it
    throw error;
  }
};
