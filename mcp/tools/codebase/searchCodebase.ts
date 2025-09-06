import { promises as fs } from "fs";
import { join, relative, extname } from "path";
import { log } from "../../utils/log";

const generateSearchVariants = (query: string): string[] => {
  const variants = new Set<string>();

  // Original query
  variants.add(query);

  // Split query into words (handle spaces, underscores, hyphens, camelCase)
  const words = query
    .replace(/[_-]/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 0);

  if (words.length > 1) {
    // camelCase
    const camelCase =
      words[0] +
      words
        .slice(1)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join("");
    variants.add(camelCase);

    // PascalCase
    const pascalCase = words
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join("");
    variants.add(pascalCase);

    // snake_case
    const snakeCase = words.join("_");
    variants.add(snakeCase);

    // kebab-case
    const kebabCase = words.join("-");
    variants.add(kebabCase);

    // UPPER_SNAKE_CASE
    const upperSnakeCase = words.join("_").toUpperCase();
    variants.add(upperSnakeCase);

    // lowercase joined
    const lowercase = words.join("");
    variants.add(lowercase);

    // UPPERCASE joined
    const uppercase = words.join("").toUpperCase();
    variants.add(uppercase);
  }

  return Array.from(variants);
};

export const searchCodebase = async function (args: {
  query: string;
  file_types?: string[];
  exclude_dirs?: string[];
}) {
  log("info", `Searching codebase for: "${args.query}"`);

  const fileTypes = args.file_types || [
    ".ts",
    ".js",
    ".tsx",
    ".jsx",
    ".py",
    ".md",
  ];
  const excludeDirs = args.exclude_dirs || [
    "node_modules",
    ".git",
    "dist",
    "build",
  ];
  const results: any[] = [];
  const startPath = join(__dirname, "../../");

  // Generate search variants for different naming conventions
  const searchVariants = generateSearchVariants(args.query);
  log("info", `Generated search variants: ${searchVariants.join(", ")}`);

  const searchDirectory = async (dirPath: string): Promise<void> => {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(dirPath, entry.name);

        if (entry.isDirectory()) {
          if (!excludeDirs.includes(entry.name)) {
            await searchDirectory(fullPath);
          }
        } else if (entry.isFile()) {
          const ext = extname(entry.name);
          if (fileTypes.includes(ext)) {
            await searchInFile(fullPath);
          }
        }
      }
    } catch (error) {
      // Skip directories that can't be read
      log("info", `Skipping directory: ${dirPath}`);
    }
  };

  const searchInFile = async (filePath: string): Promise<void> => {
    try {
      const content = await fs.readFile(filePath, "utf-8");
      const lines = content.split("\n");
      const relativePath = relative(startPath, filePath);

      lines.forEach((line, index) => {
        // Check if any of the search variants match this line
        const matchedVariants = searchVariants.filter((variant) =>
          line.toLowerCase().includes(variant.toLowerCase())
        );

        if (matchedVariants.length > 0) {
          const lineNumber = index + 1;
          const contextStart = Math.max(0, index - 1);
          const contextEnd = Math.min(lines.length, index + 2);
          const context = lines.slice(contextStart, contextEnd);

          results.push({
            file: relativePath,
            line_number: lineNumber,
            line_content: line.trim(),
            matched_variants: matchedVariants,
            context: context.map((line, idx) => ({
              line_number: contextStart + idx + 1,
              content: line,
              is_match: contextStart + idx === index,
            })),
          });
        }
      });
    } catch (error) {
      // Skip files that can't be read
      log("info", `Skipping file: ${filePath}`);
    }
  };

  await searchDirectory(startPath);

  const uniqueFiles = new Set(results.map((r) => r.file)).size;

  const guidance = `
    SEARCH RESULTS FOR "${args.query}":
    - Generated variants: ${searchVariants.join(", ")}
    - Found ${results.length} matches across ${uniqueFiles} files
    - Review existing implementations before creating new code
    - Look for patterns and conventions in the results
    - Consider reusing or extending existing functionality
      `.trim();

  log(
    "info",
    `Search completed: ${results.length} matches in ${uniqueFiles} files`
  );

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            query: args.query,
            search_variants: searchVariants,
            file_types: fileTypes,
            exclude_dirs: excludeDirs,
            results: results.slice(0, 50), // Limit results for performance
            total_matches: results.length,
            unique_files: uniqueFiles,
            guidance,
            truncated:
              results.length > 50
                ? "Results limited to first 50 matches"
                : null,
          },
          null,
          2
        ),
      },
    ],
  };
};
