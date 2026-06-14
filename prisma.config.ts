import path from "node:path";
import fs from "node:fs";
import { defineConfig } from "prisma/config";

// Manual dotenv loading for Prisma CLI in Prisma v7
function loadEnv() {
  const envPath = path.join(__dirname, ".env");
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const index = trimmed.indexOf("=");
      if (index > 0) {
        const key = trimmed.slice(0, index).trim();
        let value = trimmed.slice(index + 1).trim();
        // Strip quotes
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        process.env[key] = value;
      }
    }
  }
}

loadEnv();

export default defineConfig({
  schema: path.join(__dirname, "prisma", "schema.prisma"),
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
