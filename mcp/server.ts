#!/usr/bin/env tsx

import { Server } from "@modelcontextprotocol/sdk/server";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import db from "./../src/lib/server/prisma";
import { log } from "./utils/log";
import { cleanup } from "./utils/cleaup";
import { Tools } from "./tools/tools";

class MCPServer {
  private server: Server;
  public tools: Tools;

  constructor() {
    this.server = new Server(
      {
        name: "database-mcp-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
        },
      }
    );

    this.tools = new Tools(this.server);

    log("info", "MCP Server initialized");
  }

  async run() {
    try {
      log("info", "Establishing database connection");

      await db.$connect();

      log("info", "Database connection established");

      const transport = new StdioServerTransport();

      await this.server.connect(transport);

      log("info", "MCP server started and listening on stdio");
    } catch (error) {
      log("error", "Failed to start MCP server:", error);

      process.exit(1);
    }
  }
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
process.on("uncaughtException", (error: Error) => {
  log("error", "Uncaught exception:", error);

  cleanup();
});

process.on("uncaughtException", (error: any) => {
  if (error.code === "EPIPE") {
    process.exit(0);
  } else {
    console.error("Uncaught exception:", error);
    process.exit(1);
  }
});

new MCPServer().run();
