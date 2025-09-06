import { promises as fs } from "fs";
import { log } from "../../utils/log";
import { validateProjectPath } from "../../utils/validateProjectPath";

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
