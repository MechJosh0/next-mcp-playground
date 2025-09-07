import { join } from "path";

export const validateProjectPath = (filePath: string): string =>
  join(__dirname, "../../", filePath);
