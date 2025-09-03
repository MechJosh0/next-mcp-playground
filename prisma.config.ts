import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

if (process.env.NODE_ENV == "development") {
  loadEnv({ path: ".env.local" });
}

export default defineConfig({
  schema: "prisma/schema.prisma",
});
