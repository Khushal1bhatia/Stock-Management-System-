/**
 * Vercel build entry point.
 *
 * Local development stays on SQLite. On Vercel this script:
 *   1. rewrites the Prisma datasource to PostgreSQL for this build,
 *   2. regenerates the Prisma client against PostgreSQL,
 *   3. pushes the schema to the hosted database,
 *   4. seeds starter data only when the database has no users,
 *   5. runs the normal Next.js production build.
 *
 * The schema file is restored afterwards, so a local `FORCE_POSTGRES=1` test
 * does not leave the repository modified.
 */
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const schemaPath = path.join(root, "prisma", "schema.prisma");

function run(command) {
  console.log(`\n$ ${command}`);
  execSync(command, { stdio: "inherit", cwd: root, env: process.env });
}

function toPostgresSchema(schema) {
  let next = schema;

  if (next.includes('provider = "sqlite"')) {
    next = next.replace('provider = "sqlite"', 'provider = "postgresql"');
  }

  // Pooled URLs (Neon/Supabase) cannot run schema changes reliably. When a
  // direct URL is provided, Prisma uses it for db push and runtime stays pooled.
  if (process.env.DIRECT_URL && !next.includes("directUrl")) {
    next = next.replace(
      /(datasource db \{[\s\S]*?url\s*=\s*env\("DATABASE_URL"\))/,
      '$1\n  directUrl = env("DIRECT_URL")'
    );
  }

  return next;
}

const isVercel = process.env.VERCEL === "1" || process.env.VERCEL === "true";
const databaseUrl = process.env.DATABASE_URL || "";
const databaseIsPostgres = /^postgres(ql)?:\/\//i.test(databaseUrl);
const usePostgres = isVercel || databaseIsPostgres || process.env.FORCE_POSTGRES === "1";

if (!usePostgres) {
  console.log("Local build: keeping the SQLite schema.");
  run("npx prisma generate");
  run("npx next build");
  process.exit(0);
}

if (!databaseIsPostgres) {
  throw new Error(
    [
      "DATABASE_URL must be a PostgreSQL connection string on Vercel.",
      "",
      "Vercel has no persistent disk, so the local SQLite file cannot be used.",
      "Create a PostgreSQL database (Neon, Supabase, or Vercel Postgres) and set:",
      "  DATABASE_URL  - pooled connection string",
      "  DIRECT_URL    - direct connection string (optional, recommended)",
      "",
      "Add them in Vercel -> Project -> Settings -> Environment Variables."
    ].join("\n")
  );
}

const original = readFileSync(schemaPath, "utf8");
const patched = toPostgresSchema(original);

if (patched === original) {
  console.log("Prisma schema already targets PostgreSQL.");
} else {
  writeFileSync(schemaPath, patched);
  console.log("Switched prisma/schema.prisma to PostgreSQL for this build.");
}

try {
  run("npx prisma generate");
  // `db push` creates the schema on a fresh database and applies additive
  // changes on later deploys without needing a local shadow database.
  run("npx prisma db push --skip-generate");
  run("node scripts/seed-if-empty.mjs");
  run("npx next build");
} finally {
  if (patched !== original) {
    writeFileSync(schemaPath, original);
    console.log("Restored prisma/schema.prisma after the build.");
  }
}
