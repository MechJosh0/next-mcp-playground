import { join } from "path";
import { Server } from "@modelcontextprotocol/sdk/server";
import {
  ErrorCode,
  ListResourcesRequestSchema,
  McpError,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { log } from "./../utils/log";
import { readFileSync } from "fs";

export class Resources {
  private server: Server;

  constructor(server: Server) {
    this.server = server;

    this.listSchema();
    this.callSchema();
  }

  private listSchema(): void {
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: [
        {
          uri: "file://project_config.md",
          name: "Project config",
          description: "Core project configuration",
          mimeType: "text/markdown",
        },
      ],
    }));
  }

  private callSchema(): void {
    this.server.setRequestHandler(
      ReadResourceRequestSchema,
      async (request) => {
        try {
          const { uri } = request.params;

          log("info", `Executing resource: ${uri}`);

          const fileName = uri.replace(/^file:\/\//, "");
          const content = readFileSync(join(__dirname, fileName), "utf-8");

          return {
            contents: [
              {
                uri,
                mimeType: "text/markdown",
                text: content,
              },
            ],
          };
        } catch (error) {
          throw new McpError(
            ErrorCode.InternalError,
            "Could not read project config file"
          );
        }
      }
    );
  }
}
