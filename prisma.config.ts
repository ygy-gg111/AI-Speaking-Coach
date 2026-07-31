import { loadEnvFile } from "node:process";

import { defineConfig, env } from "prisma/config";

for (const path of [".env.local", ".env"]) {
  try {
    loadEnvFile(path);
  } catch {
    // Local env files are optional in CI and during static validation.
  }
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "node prisma/seed.mjs",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
