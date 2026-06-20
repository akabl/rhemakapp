// prisma.config.ts
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // Using process.env instead of env() prevents crash errors during "generate"
    url: process.env.DATABASE_URL!,
  },
});