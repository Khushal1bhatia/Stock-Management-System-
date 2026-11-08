#!/usr/bin/env node
/**
 * Production build for the Stock Management System.
 *
 * The portal is intentionally framework-free at runtime: classic scripts and
 * plain CSS keep it working from file:// (start.bat) as well as from a static
 * host. This build verifies every local reference, copies the deployable files
 * into dist/, and fails on missing assets or machine-specific paths.
 */
import { cp, mkdir, readFile, readdir, rm, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");

const ROOT_FILES = [
  "index.html",
  "fonts.css",
  "styles.css",
  "views.css",
  "login.css",
  "favicon.ico",
  "manifest.json",
  "robots.txt",
  "start.bat"
];

const ROOT_DIRS = ["js", "assets"];
const TEXT_EXTENSIONS = new Set([".html", ".css", ".js", ".json", ".txt", ".bat"]);
const LOCAL_PATH_PATTERN = /(?:[A-Za-z]:\\Users\\|\/Users\/[A-Za-z0-9._-]+|\/home\/[A-Za-z0-9._-]+)/;

const problems = [];

function log(message) {
  process.stdout.write(`${message}\n`);
}

async function pathSize(target) {
  const info = await stat(target);
  if (!info.isDirectory()) return info.size;
  const entries = await readdir(target, { withFileTypes: true });
  let total = 0;
  for (const entry of entries) {
    total += await pathSize(path.join(target, entry.name));
  }
  return total;
}

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(full);
    } else {
      yieldFile(full);
    }
  }
}

const files = [];
function yieldFile(file) {
  files.push(file);
}

function relative(file) {
  return path.relative(dist, file).split(path.sep).join("/");
}

async function verifyReferences() {
  const indexPath = path.join(dist, "index.html");
  const html = await readFile(indexPath, "utf8");
  const references = new Set();

  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) references.add(match[1]);
  for (const match of html.matchAll(/content="((?:\.\/)?assets\/[^"]+)"/g)) references.add(match[1]);

  for (const reference of references) {
    if (!reference || reference.startsWith("#")) continue;
    if (/^(?:https?:|data:|mailto:|tel:)/.test(reference)) continue;
    const cleaned = reference.split("?")[0].split("#")[0].replace(/^\.\//, "");
    if (!cleaned) continue;
    if (!existsSync(path.join(dist, cleaned))) {
      problems.push(`index.html references a missing file: ${reference}`);
    }
  }

  const manifestPath = path.join(dist, "manifest.json");
  try {
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    for (const icon of manifest.icons || []) {
      const iconPath = icon.src?.replace(/^\.\//, "");
      if (iconPath && !existsSync(path.join(dist, iconPath))) {
        problems.push(`manifest.json references a missing icon: ${icon.src}`);
      }
    }
  } catch (error) {
    problems.push(`manifest.json is not valid JSON: ${error.message}`);
  }

  const core = await readFile(path.join(dist, "js", "core.js"), "utf8");
  const documentFiles = [...core.matchAll(/fileName:\s*"([^"]+\.pdf)"/g)].map((match) => match[1]);
  if (documentFiles.length !== 6) {
    problems.push(`Expected 6 reference PDFs in js/core.js, found ${documentFiles.length}.`);
  }
  for (const fileName of documentFiles) {
    if (!existsSync(path.join(dist, "assets", "documents", fileName))) {
      problems.push(`Document Master references a missing PDF: assets/documents/${fileName}`);
    }
  }
}

async function verifyNoLocalPaths() {
  await walk(dist);
  for (const file of files) {
    if (!TEXT_EXTENSIONS.has(path.extname(file).toLowerCase())) continue;
    const content = await readFile(file, "utf8");
    const match = content.match(LOCAL_PATH_PATTERN);
    if (match) {
      problems.push(`${relative(file)} contains a machine-specific path: ${match[0]}`);
    }
  }
}

async function main() {
  log("Building Stock Management System…");

  await rm(dist, { recursive: true, force: true });
  await mkdir(dist, { recursive: true });

  for (const file of ROOT_FILES) {
    await cp(path.join(root, file), path.join(dist, file));
  }
  for (const dir of ROOT_DIRS) {
    await cp(path.join(root, dir), path.join(dist, dir), { recursive: true });
  }

  await verifyReferences();
  await verifyNoLocalPaths();

  if (problems.length) {
    log("\nBuild failed:");
    for (const problem of problems) log(`  • ${problem}`);
    process.exit(1);
  }

  const size = await pathSize(dist);
  log(`Build complete: ${files.length} files, ${(size / 1024).toFixed(1)} KB in dist/`);
  log("Every local asset resolves; no machine-specific paths found.");
}

main().catch((error) => {
  log(`\nBuild failed: ${error.stack || error.message}`);
  process.exit(1);
});
