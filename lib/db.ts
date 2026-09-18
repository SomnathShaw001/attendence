import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

// On Vercel Serverless, SQLite requires a writable file located in /tmp
if (process.env.VERCEL) {
  try {
    const tmpDbPath = "/tmp/dev.db";
    const bundledDbPath = path.join(process.cwd(), "prisma", "dev.db");
    if (!fs.existsSync(tmpDbPath) && fs.existsSync(bundledDbPath)) {
      fs.copyFileSync(bundledDbPath, tmpDbPath);
    }
    if (!process.env.DATABASE_URL || process.env.DATABASE_URL.startsWith("file:")) {
      process.env.DATABASE_URL = "file:/tmp/dev.db";
    }
  } catch (err) {
    console.error("Vercel SQLite sync error:", err);
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
