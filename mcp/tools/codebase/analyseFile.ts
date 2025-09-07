import { promises as fs } from "fs";
import { log } from "../../utils/log";
import { validateProjectPath } from "../../utils/validateProjectPath";
import { Tool } from "@modelcontextprotocol/sdk/types.js";
import path from "path";

export const analyseFileMeta: Tool = {
  name: "analyse_file",
  description:
    "Get file summary, dependencies, and exports. Analyses code structure, imports, exports, and provides insights about the file's purpose and relationships.",
  inputSchema: {
    type: "object",
    properties: {
      file_path: {
        type: "string",
        description: "Path to file to analyse, relative to project root",
      },
    },
    required: ["file_path"],
    additionalProperties: false,
  },
};

const extractImports = (content: string, fileExt: string): string[] => {
  const imports: string[] = [];
  const lines = content.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();

    // ES6 imports
    if (trimmed.startsWith("import ")) {
      const fromMatch = trimmed.match(/from ['"]([^'"]+)['"]/);
      if (fromMatch) {
        imports.push(fromMatch[1]);
      }
    }

    // CommonJS requires
    if (trimmed.includes("require(")) {
      const requireMatch = trimmed.match(/require\(['"]([^'"]+)['"]\)/);
      if (requireMatch) {
        imports.push(requireMatch[1]);
      }
    }

    // Dynamic imports
    if (trimmed.includes("import(")) {
      const dynamicMatch = trimmed.match(/import\(['"]([^'"]+)['"]\)/);
      if (dynamicMatch) {
        imports.push(dynamicMatch[1]);
      }
    }
  }

  return [...new Set(imports)]; // Remove duplicates
};

const extractExports = (content: string, fileExt: string): string[] => {
  const exports: string[] = [];
  const lines = content.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();

    // Named exports
    if (trimmed.startsWith("export ")) {
      // export const/let/var/function/class
      const namedMatch = trimmed.match(
        /export (?:const|let|var|function|class|interface|type|enum) (\w+)/
      );
      if (namedMatch) {
        exports.push(namedMatch[1]);
      }

      // export { ... }
      const braceMatch = trimmed.match(/export \{([^}]+)\}/);
      if (braceMatch) {
        const items = braceMatch[1]
          .split(",")
          .map((item) => item.trim().split(" as ")[0]);
        exports.push(...items);
      }
    }

    // Default exports
    if (trimmed.startsWith("export default")) {
      const defaultMatch = trimmed.match(
        /export default (?:class|function|interface|type|enum)?\s*(\w+)?/
      );
      if (defaultMatch && defaultMatch[1]) {
        exports.push(`default: ${defaultMatch[1]}`);
      } else {
        exports.push("default");
      }
    }

    // Module.exports (CommonJS)
    if (trimmed.includes("module.exports")) {
      exports.push("module.exports");
    }

    // exports.something (CommonJS)
    if (trimmed.startsWith("exports.")) {
      const exportsMatch = trimmed.match(/exports\.(\w+)/);
      if (exportsMatch) {
        exports.push(exportsMatch[1]);
      }
    }
  }

  return [...new Set(exports)]; // Remove duplicates
};

const analyseFileContent = (
  content: string,
  fileName: string,
  fileExt: string
) => {
  const lines = content.split("\n");
  const nonEmptyLines = lines.filter((line) => line.trim().length > 0);
  const commentLines = lines.filter((line) => {
    const trimmed = line.trim();
    return (
      trimmed.startsWith("//") ||
      trimmed.startsWith("/*") ||
      trimmed.startsWith("*")
    );
  });

  // Determine file type and purpose
  let fileType = "Unknown";
  let purpose = "General purpose file";

  if (fileExt === ".ts" || fileExt === ".tsx") {
    fileType =
      fileExt === ".tsx" ? "React TypeScript Component" : "TypeScript Module";
  } else if (fileExt === ".js" || fileExt === ".jsx") {
    fileType =
      fileExt === ".jsx" ? "React JavaScript Component" : "JavaScript Module";
  } else if (fileExt === ".md") {
    fileType = "Markdown Documentation";
    purpose = "Documentation file";
  } else if (fileExt === ".json") {
    fileType = "JSON Configuration";
    purpose = "Configuration or data file";
  } else if (fileExt === ".css") {
    fileType = "CSS Stylesheet";
    purpose = "Styling file";
  }

  // Analyse content for specific patterns
  if (
    content.includes("React") ||
    content.includes("useState") ||
    content.includes("useEffect")
  ) {
    purpose = "React component or hook";
  } else if (content.includes("export class") || content.includes("class ")) {
    purpose = "Class definition";
  } else if (
    content.includes("export function") ||
    content.includes("function ")
  ) {
    purpose = "Function utilities";
  } else if (content.includes("interface ") || content.includes("type ")) {
    purpose = "Type definitions";
  } else if (
    content.includes("describe(") ||
    content.includes("test(") ||
    content.includes("it(")
  ) {
    purpose = "Test file";
  } else if (content.includes("@modelcontextprotocol")) {
    purpose = "MCP tool or server component";
  }

  return {
    fileType,
    purpose,
    stats: {
      totalLines: lines.length,
      codeLines: nonEmptyLines.length,
      commentLines: commentLines.length,
      fileSize: content.length,
    },
  };
};

export const analyseFile = async function (args: { file_path: string }) {
  try {
    const safePath = validateProjectPath(args.file_path);

    log("info", `Analyzing file: ${safePath}`);

    const content = await fs.readFile(safePath, "utf-8");
    const stats = await fs.stat(safePath);
    const fileExt = path.extname(args.file_path);
    const fileName = path.basename(args.file_path);

    const imports = extractImports(content, fileExt);
    const exports = extractExports(content, fileExt);
    const analysis = analyseFileContent(content, fileName, fileExt);

    // Categorize dependencies
    const dependencies = {
      external_packages: imports.filter(
        (imp) => !imp.startsWith(".") && !imp.startsWith("/")
      ),
      internal_modules: imports.filter(
        (imp) => imp.startsWith(".") || imp.startsWith("/")
      ),
      node_modules: imports.filter(
        (imp) =>
          !imp.startsWith(".") && !imp.startsWith("/") && !imp.includes("@")
      ),
      scoped_packages: imports.filter((imp) => imp.startsWith("@")),
    };

    const summary = `
      FILE ANALYSIS SUMMARY:
      - Type: ${analysis.fileType}
      - Purpose: ${analysis.purpose}
      - Dependencies: ${imports.length} imports found
      - Exports: ${exports.length} exports found
      - Code Quality: ${analysis.stats.codeLines} lines of code, ${analysis.stats.commentLines} comment lines

      DEPENDENCIES BREAKDOWN:
      - External packages: ${dependencies.external_packages.length}
      - Internal modules: ${dependencies.internal_modules.length}
      - Scoped packages: ${dependencies.scoped_packages.length}

      USAGE RECOMMENDATIONS:
      - Review imports for unused dependencies
      - Consider breaking down large files (${analysis.stats.codeLines}+ lines)
      - Ensure proper TypeScript typing if applicable
      - Check for circular dependencies with internal modules
    `.trim();

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              file_path: args.file_path,
              file_name: fileName,
              file_extension: fileExt,
              file_type: analysis.fileType,
              purpose: analysis.purpose,
              file_stats: {
                ...analysis.stats,
                last_modified: stats.mtime.toISOString(),
              },
              dependencies: {
                all_imports: imports,
                external_packages: dependencies.external_packages,
                internal_modules: dependencies.internal_modules,
                scoped_packages: dependencies.scoped_packages,
              },
              exports: exports,
              summary: summary,
              guidance:
                "Use this analysis to understand file relationships, optimize imports, and maintain code quality.",
            },
            null,
            2
          ),
        },
      ],
    };
  } catch (error: any) {
    log("error", `Failed to analyse file: ${args.file_path}`, {
      error: error.message,
    });

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              error: `Failed to analyse ${args.file_path}: ${error.message}`,
              file_path: args.file_path,
              guidance:
                "Check that the file exists and is readable. Ensure the file path is correct.",
            },
            null,
            2
          ),
        },
      ],
    };
  }
};
