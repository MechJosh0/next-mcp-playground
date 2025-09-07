import { promises as fs } from "fs";
import path, { join } from "path";
import { validateProjectPath } from "../../utils/validateProjectPath";
import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const writeFileMeta: Tool = {
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
};

export const writeFile = async function (args: {
  file_path: string;
  content: string;
}) {
  const safePath = validateProjectPath(args.file_path);

  try {
    await fs.mkdir(path.dirname(safePath), { recursive: true });
    await fs.writeFile(safePath, args.content, "utf-8");

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              success: `File written: ${args.file_path}`,
              file_size: args.content.length,
              guidance:
                "File created successfully. Consider running tests if this affects functionality.",
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
              error: `Failed to write ${args.file_path}: ${error.message}`,
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
