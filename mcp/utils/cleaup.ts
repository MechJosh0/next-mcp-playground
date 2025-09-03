import db from "./../../src/lib/server/prisma";
import { log } from "./log";

export const cleanup = async (): Promise<void> => {
  log("info", "Shutting down MCP server...");

  try {
    await db.$disconnect();

    log("info", "Database connection closed");
  } catch (error: any) {
    log("error", "Error during cleanup:", error);
  }

  process.exit(0);
};
