#!/usr/bin/env tsx

import { Server } from "@modelcontextprotocol/sdk/server";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { log } from "./../utils/log";
import { userCreate } from "./user/userCreate";

export class Tools {
  private server: Server;

  constructor(server: Server) {
    this.server = server;

    this.listSchema();
    this.callSchema();
  }

  private listSchema(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
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
        },
      ],
    }));
  }

  async executeCall(name: string, args: object) {
    switch (name) {
      case "create_user":
        return await userCreate(args);
      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
  }

  private callSchema(): void {
    this.server.setRequestHandler(
      CallToolRequestSchema,
      async (request: any) => {
        try {
          const { name, arguments: args } = request.params;
          const startTime = Date.now();

          log("info", `Executing tool: ${name}`, args);

          // Add timeout wrapper for all operations
          const result = await Promise.race([
            this.executeCall(name, args || {}),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error("Operation timed out")), 1000)
            ),
          ]);

          const duration = Date.now() - startTime;
          log("info", `Tool ${name} completed in ${duration}ms`);

          return result;
        } catch (error: any) {
          const duration = Date.now() - startTime;
          log("error", `Tool ${name} failed after ${duration}ms:`, {
            error: error.message,
          });

          return {
            content: [{ type: "text", text: error.message }],
          };
        }
      }
    );
  }
}
