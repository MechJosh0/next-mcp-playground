import { promises as fs } from "fs";
import path, { join } from "path";

export const writeFile = async function (args: {
  file_path: string;
  content: string;
}) {
  const safePath = join(__dirname, "../../", args.file_path);

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
