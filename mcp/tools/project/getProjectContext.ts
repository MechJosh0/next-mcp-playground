import { promises as fs } from "fs";
import path from "path";
import { Tool } from "@modelcontextprotocol/sdk/types.js";

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
    // Load project configuration
    const configPath = path.join(process.cwd(), "project_config.json");
    const configContent = await fs.readFile(configPath, "utf-8");
    const config = JSON.parse(configContent);

    // Generate contextual guidance
    const guidance = `
      CODING BUDDY CONTEXT FOR ${config.name}:
      - Tech Stack: ${config.tech_stack.join(", ")}
      - Architecture: ${config.architecture}
      - Current Goals: ${config.current_goals.join(", ")}
      - Coding Standards: ${config.coding_standards.naming}, max ${
      config.coding_standards.max_line_length
    } chars

      AUTOMATIC BEHAVIOR:
      - Follow ${config.coding_standards.style_guide}
      - Place components in appropriate directories
      - Reference current goals when suggesting features
      - Use project's established patterns
          `.trim();

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              project_name: config.name,
              tech_stack: config.tech_stack,
              current_goals: config.current_goals,
              coding_standards: config.coding_standards,
              architecture: config.architecture,
              guidance,
            },
            null,
            2
          ),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              project_name: "Unknown Project",
              tech_stack: ["TypeScript"],
              current_goals: [],
              coding_standards: {
                naming: "camelCase",
                max_line_length: 100,
                style_guide: "ESLint + Prettier",
              },
              architecture: "Not specified",
              guidance:
                "No project configuration found. Using TypeScript defaults.",
            },
            null,
            2
          ),
        },
      ],
    };
  }
};
