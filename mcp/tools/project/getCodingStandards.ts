import { promises as fs } from "fs";
import { log } from "../../utils/log";
import { validateProjectPath } from "../../utils/validateProjectPath";
import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const getCodingStandardsMeta: Tool = {
  name: "get_coding_standards",
  description:
    "Return coding standards from the documented standards file.",
  inputSchema: {
    type: "object",
    properties: {},
    additionalProperties: false,
  },
};

export const getCodingStandards = async function () {
  try {
    // Read coding standards from markdown file
    const standardsPath = validateProjectPath("mcp/tools/project/coding_standards.md");
    const standardsContent = await fs.readFile(standardsPath, "utf-8");
    
    log("info", "Loaded coding standards from markdown file");
    
    // Extract title from markdown
    const titleMatch = standardsContent.match(/^# (.+)$/m);
    const title = titleMatch ? titleMatch[1] : "Coding Standards";
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              title: title,
              standards_content: standardsContent,
            },
            null,
            2
          ),
        },
      ],
    };
    
  } catch (error: any) {
    log("error", "Failed to get coding standards", { error: error.message });
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              error: `Coding standards file not found: ${error.message}`,
              file_path: "mcp/tools/project/coding_standards.md",
              message: "The coding standards markdown file could not be loaded. Please ensure the file exists and is readable.",
            },
            null,
            2
          ),
        },
      ],
    };
  }
};
