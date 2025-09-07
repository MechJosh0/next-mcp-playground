import { promises as fs } from "fs";
import { log } from "../../utils/log";
import { validateProjectPath } from "../../utils/validateProjectPath";
import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const readFileMeta: Tool = {
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
};

export const readFile = async function (args: { file_path: string }) {
  try {
    const safePath = validateProjectPath(args.file_path);

    log("info", `Reading file: ${safePath}`);

    const content = await fs.readFile(safePath, "utf-8");
    const stats = await fs.stat(safePath);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              content,
              file_path: args.file_path,
              file_size: content.length,
              last_modified: stats.mtime.toISOString(),
              guidance:
                "File read successfully. Use this content to understand existing patterns before writing new code.",
            },
            null,
            2
          ),
        },
      ],
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              error: `Failed to read ${args.file_path}: ${error.message}`,
              file_path: args.file_path,
            },
            null,
            2
          ),
        },
      ],
    };
  }
};
