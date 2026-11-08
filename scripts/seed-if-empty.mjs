/**
 * Seeds the production database only when it is still empty.
 *
 * The regular seed command is destructive (it resets data), so it must never
 * run on every deploy. This wrapper checks for existing users first. If the
 * database already has accounts, it exits without touching anything.
 */
import { execSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const userCount = await prisma.user.count();
await prisma.$disconnect();

if (userCount > 0) {
  console.log(`Database already has ${userCount} user(s); skipping seed.`);
  process.exit(0);
}

const adminPassword = process.env.SEED_ADMIN_PASSWORD;
const operatorPassword = process.env.SEED_OPERATOR_PASSWORD;
const passwordsReady =
  typeof adminPassword === "string" &&
  adminPassword.length >= 12 &&
  typeof operatorPassword === "string" &&
  operatorPassword.length >= 12;

if (!passwordsReady) {
  console.warn(
    [
      "",
      "Database is empty, but SEED_ADMIN_PASSWORD and SEED_OPERATOR_PASSWORD",
      "(12+ characters each) are missing or too short.",
      "",
      "Skipping the seed so the deployment can continue. Add both variables in",
      "Vercel -> Settings -> Environment Variables and redeploy, or run:",
      "  npx prisma db seed",
      "against the production database."
    ].join("\n")
  );
  process.exit(0);
}

console.log("Empty database detected - seeding starter data and accounts...");
execSync("npx tsx prisma/seed.ts", {
  stdio: "inherit",
  cwd: process.cwd(),
  env: process.env
});
