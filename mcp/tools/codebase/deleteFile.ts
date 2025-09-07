import { promises as fs } from "fs";
import { log } from "../../utils/log";
import { validateProjectPath } from "../../utils/validateProjectPath";
import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const deleteFileMeta: Tool = {
  name: "delete_file",
  description:
    "Delete a file from the project directory. Use with caution - this operation cannot be undone. Useful for cleaning up moved files, removing generated content, or refactoring.",
  inputSchema: {
    type: "object",
    properties: {
      file_path: {
        type: "string",
        description: "Path to file to delete, relative to project root",
      },
      confirm: {
        type: "boolean",
        description: "Confirmation flag to prevent accidental deletions (default: false)",
        default: false,
      },
    },
    required: ["file_path"],
    additionalProperties: false,
  },
};

export const deleteFile = async function (args: {
  file_path: string;
  confirm?: boolean;
}) {
  try {
    // Safety check - require confirmation
    if (!args.confirm) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                error: "Deletion requires confirmation",
                file_path: args.file_path,
                message: "Set 'confirm: true' to proceed with deletion",
                guidance: "This safety check prevents accidental file deletions.",
              },
              null,
              2
            ),
          },
        ],
      };
    }

    const safePath = validateProjectPath(args.file_path);

    log("info", `Attempting to delete file: ${safePath}`);

    // Check if file exists first
    try {
      await fs.access(safePath);
    } catch {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                error: `File not found: ${args.file_path}`,
                file_path: args.file_path,
                guidance: "Cannot delete a file that does not exist.",
              },
              null,
              2
            ),
          },
        ],
      };
    }

    // Get file info before deletion
    const stats = await fs.stat(safePath);

    // Perform the deletion
    await fs.unlink(safePath);

    log("info", `Successfully deleted file: ${safePath}`);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              success: `File deleted: ${args.file_path}`,
              file_path: args.file_path,
              file_size: stats.size,
              last_modified: stats.mtime.toISOString(),
              guidance: "File has been permanently deleted. This operation cannot be undone.",
            },
            null,
            2
          ),
        },
      ],
    };
  } catch (error: any) {
    log("error", `Failed to delete file: ${args.file_path}`, { error: error.message });

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              error: `Failed to delete ${args.file_path}: ${error.message}`,
              file_path: args.file_path,
              guidance: "Check file permissions and ensure the file path is correct.",
            },
            null,
            2
          ),
        },
      ],
    };
  }
};
