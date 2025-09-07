import { promises as fs } from "fs";
import path from "path";
import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { validateProjectPath } from "../../utils/validateProjectPath";

export const getProjectContextMeta: Tool = {
  name: "get_project_context",
  description:
    "Get current project configuration, tech stack, coding standards, and goals. Call this when you need to understand the project context or when user asks about project details.",
  inputSchema: {
    type: "object",
    properties: {},
    additionalProperties: false,
  },
};

export const getProjectContext = async function () {
  try {
    // Load project configuration from markdown using validateProjectPath
    const configPath = validateProjectPath(
      "mcp/tools/project/project_config.md"
    );
    const configContent = await fs.readFile(configPath, "utf-8");

    // Extract project name from the markdown title
    const projectNameMatch = configContent.match(/^# (.+)$/m);
    const projectName = projectNameMatch
      ? projectNameMatch[1]
      : "Unknown Project";

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              project_name: projectName,
              configuration: configContent,
              guidance: `Project configuration loaded from mcp/tools/project/project_config.md. This markdown file serves as the single source of truth for project context, coding standards, architecture, and development guidelines.`,
            },
            null,
            2
          ),
        },
      ],
    };
  } catch (error) {
    // Return default context if config doesn't exist
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              error:
                "No project_config.md found, quit the tool actions so we don't write the wrong type of code.",
            },
            null,
            2
          ),
        },
      ],
    };
  }
};
