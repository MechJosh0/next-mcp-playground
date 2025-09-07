import db from "./../../../src/lib/server/prisma";
import { log } from "./../../utils/log";
import { Tool } from "@modelcontextprotocol/sdk/types.js";

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
  log("info", "try to create the user!");

  const user = await db.user.create({
    data: {
      email: args.email.toLowerCase().trim(),
      name: args.name?.trim() || null,
    },
  });

  return {
    content: [
      {
        type: "text",
        text: `Created user: ${user.name || user.email}, Email: ${
          user.email
        }, ID: ${user.id}`,
      },
    ],
  };
};
