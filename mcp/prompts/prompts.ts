import { join } from "path";
import { Server } from "@modelcontextprotocol/sdk/server";
import {
  ErrorCode,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { log } from "./../utils/log";
import { readFileSync } from "fs";
import parse from "json-templates";

export class Prompts {
  private server: Server;

  constructor(server: Server) {
    this.server = server;

    this.listSchema();
    this.callSchema();
  }

  private listSchema(): void {
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => ({
      prompts: [
        {
          name: "greeting",
          description: "Generate a personalized greeting",
          arguments: [
            {
              name: "name",
              description: "Name of the person to greet",
              required: true,
            },
          ],
        },
        {
          name: "coding_buddy",
          title: "Coding buddy",
          description: "Annoyed and bored behaviour",
        },
      ],
    }));
  }

  private callSchema(): void {
    this.server.setRequestHandler(GetPromptRequestSchema, (request) => {
      try {
        const { name, arguments: args } = request.params;

        log("info", `Executing prompt: ${name}`, JSON.stringify(args));

        const file = readFileSync(join(__dirname, `${name}.json`), "utf-8");

        const template = parse(file);
        const prompt = template(args);

        return JSON.parse(prompt);
      } catch (error) {
        throw new McpError(
          ErrorCode.InternalError,
          "Could not read prompt file"
        );
      }
    });
  }
}
