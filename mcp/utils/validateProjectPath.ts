import path from "path";

export const validateProjectPath = (filePath: string): string =>
  path.join(process.cwd(), filePath);
