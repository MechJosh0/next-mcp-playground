import { promises as fs } from "fs";
import path from "path";
import { validateProjectPath } from "../../utils/validateProjectPath";
import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const getFileStructureMeta: Tool = {
  name: "get_file_structure",
  description:
    "Get an organized view of the project structure. Claude calls this to understand where files should be placed when creating new components.",
  inputSchema: {
    type: "object",
    properties: {
      directory: {
        type: "string",
        description:
          "Directory to analyse (optional, defaults to project root)",
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
};

export const getFileStructure = async function (args: {
  directory?: string;
  max_depth?: number;
}) {
  const directory = args.directory || ".";
  const maxDepth = args.max_depth || 3;
  const safePath = validateProjectPath(directory);

  const buildStructure = async (
    dirPath: string,
    currentDepth: number = 0
  ): Promise<any> => {
    if (currentDepth >= maxDepth) return "...";

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      const structure: any = {};

      for (const entry of entries) {
        // Skip hidden files and common ignore patterns
        if (
          entry.name.startsWith(".") ||
          ["node_modules", "dist", "build", ".git"].includes(entry.name)
        ) {
          continue;
        }

        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
          structure[entry.name + "/"] = await buildStructure(
            fullPath,
            currentDepth + 1
          );
        } else {
          const ext = path.extname(entry.name);

          structure[entry.name] = ext || "file";
        }
      }
      return structure;
    } catch (error: any) {
      return { error: error.message };
    }
  };

  try {
    const structure = await buildStructure(safePath);
    const summary = `
      PROJECT STRUCTURE SUMMARY:
      - Directory: ${directory}
      - Shows where components, files, and folders are organised
      - Use this to understand where to place new files
      - Hidden files and build directories omitted for clarity

      COMMON PATTERNS:
      - Follows the folder structure of App Router Structure from Next.js 13+
      - Types/interfaces in ./src/types/
      - ./src/ - Next.js App Router application
      - ./prisma/ - Database schema and migrations
      - ./mcp/ - Model Context Protocol server and tools
      - MCP tools in ./mcp/tools/, resources in ./mcp/resources/, and prompts in ./mcp/prompts/
          `.trim();

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              directory,
              structure,
              summary,
              guidance:
                "Use this structure to place new files in appropriate locations following project conventions.",
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
              error: `Failed to analyse directory structure: ${error.message}`,
              directory,
            },
            null,
            2
          ),
        },
      ],
    };
  }
};
