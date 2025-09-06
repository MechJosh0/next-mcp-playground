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
import { readFile } from "./codebase/readFile";
import { writeFile } from "./codebase/writeFile";
import { getProjectContext } from "./project/getProjectContext";
import { getFileStructure } from "./codebase/getFileStructure";
import { searchCodebase } from "./codebase/searchCodebase";

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
        {
          name: "read_file",
          description:
            "Read a file from the project directory. Used when Claude needs to understand existing code, configuration, or any project file.",
          inputSchema: {
            type: "object",
            properties: {
              file_path: {
                type: "string",
                description: "Path to file relative to project root",
              },
            },
            required: ["file_path"],
            additionalProperties: false,
          },
        },
        {
          name: "write_file",
          description:
            "Create or update a file in the project. Claude typically calls get_project_context first to understand coding standards.",
          inputSchema: {
            type: "object",
            properties: {
              file_path: {
                type: "string",
                description:
                  "Path where to write the file relative to project root",
              },
              content: {
                type: "string",
                description: "File content to write",
              },
              backup: {
                type: "boolean",
                description: "Create backup of existing file (default: true)",
                default: true,
              },
            },
            required: ["file_path", "content"],
            additionalProperties: false,
          },
        },
        {
          name: "get_project_context",
          description:
            "Get current project configuration, tech stack, coding standards, and goals. Call this when you need to understand the project context or when user asks about project details.",
          inputSchema: {
            type: "object",
            properties: {},
            additionalProperties: false,
          },
        },
        {
          name: "get_file_structure",
          description:
            "Get an organized view of the project structure. Claude calls this to understand where files should be placed when creating new components.",
          inputSchema: {
            type: "object",
            properties: {
              directory: {
                type: "string",
                description:
                  "Directory to analyze (optional, defaults to project root)",
                default: ".",
              },
              max_depth: {
                type: "number",
                description: "Maximum depth to traverse (default: 3)",
                default: 3,
              },
            },
            additionalProperties: false,
          },
        },
        {
          name: "search_codebase",
          description:
            "Search for code patterns, functions, or text across the entire project. Use this to find existing implementations before creating new ones.",
          inputSchema: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "Search term or pattern to find",
              },
              file_types: {
                type: "array",
                items: { type: "string" },
                description: "File extensions to search (e.g., ['.ts', '.js'])",
                default: [".ts", ".js", ".tsx", ".jsx", ".py", ".md"],
              },
              exclude_dirs: {
                type: "array",
                items: { type: "string" },
                description: "Directories to exclude from search",
                default: ["node_modules", ".git", "dist", "build"],
              },
            },
            required: ["query"],
            additionalProperties: false,
          },
        },
      ],
    }));
  }

  async executeCall(name: string, args: object) {
    switch (name) {
      case "create_user":
        return await userCreate(args as { email: string; name?: string });
      case "read_file":
        return await readFile(args as { file_path: string });
      case "write_file":
        return await writeFile(args as { file_path: string; content: string });
      case "get_project_context":
        return await getProjectContext();
      case "get_file_structure":
        return await getFileStructure(
          args as { directory?: string; max_depth?: number }
        );
      case "search_codebase":
        return await searchCodebase(
          args as {
            query: string;
            file_types?: string[];
            exclude_dirs?: string[];
          }
        );
      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
  }

  private callSchema(): void {
    this.server.setRequestHandler(
      CallToolRequestSchema,
      async (request: any) => {
        const startTime = Date.now();

        try {
          const { name, arguments: args } = request.params;

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
