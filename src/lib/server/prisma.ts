import { Prisma, PrismaClient } from "@prisma/client";

declare global {
  var __prisma__: PrismaClient | undefined;
}

let log: (Prisma.LogLevel | Prisma.LogDefinition)[] = ["error"];

if (process.env.MCP_SERVER === "true") {
  log = [
    {
      emit: "event",
      level: "error",
    },
  ];
} else if (process.env.NODE_ENV === "development") {
  log = ["query", "error"];
}

export const db =
  globalThis.__prisma__ ??
  new PrismaClient({
    log,
    errorFormat: "pretty",
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma__ = db;
}

export default db;
