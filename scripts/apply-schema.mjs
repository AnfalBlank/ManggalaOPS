import fs from "node:fs/promises";
import { createClient } from "@libsql/client";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  throw new Error("Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN");
}

const migrationsDir = new URL("../db/migrations/", import.meta.url);
const client = createClient({ url, authToken });

async function listMigrationFiles() {
  return (await fs.readdir(migrationsDir))
    .filter((name) => name.endsWith(".sql"))
    .sort();
}

async function tableExists(tableName) {
  const result = await client.execute({
    sql: "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ? LIMIT 1",
    args: [tableName],
  });
  return result.rows.length > 0;
}

function splitStatements(sql) {
  return sql
    .split(/--> statement-breakpoint|;\s*\n/g)
    .map((statement) => statement.trim())
    .filter(Boolean);
}

function isIgnorableMigrationError(message) {
  return message.includes("already exists") || message.includes("duplicate column name");
}

async function runStatements(file, statements, { quietSkip = true } = {}) {
  let applied = 0;
  let skipped = 0;

  for (const statement of statements) {
    try {
      await client.execute(statement);
      applied += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (isIgnorableMigrationError(message)) {
        skipped += 1;
        if (!quietSkip) {
          console.log(`SKIP ${file}: ${message}`);
        }
        continue;
      }
      throw error;
    }
  }

  return { applied, skipped };
}

async function bootstrapEmptyDatabase(files) {
  const bootstrapFile = files.find((file) => file.startsWith("0000_"));
  if (!bootstrapFile) {
    throw new Error("Bootstrap migration 0000_* not found");
  }

  const sql = await fs.readFile(new URL(`../db/migrations/${bootstrapFile}`, import.meta.url), "utf8");
  const statements = splitStatements(sql);
  const result = await runStatements(bootstrapFile, statements, { quietSkip: false });

  console.log(`Mode: bootstrap kosong`);
  console.log(`Bootstrap file: ${bootstrapFile}`);
  console.log(`Applied ${result.applied} statements.`);

  return files.filter((file) => file !== bootstrapFile);
}

async function patchExistingDatabase(files) {
  console.log("Mode: patch existing database");
  return files.filter((file) => !file.startsWith("0000_") && !file.startsWith("0001_"));
}

const files = await listMigrationFiles();
const hasAccountsTable = await tableExists("accounts");

const patchFiles = hasAccountsTable
  ? await patchExistingDatabase(files)
  : await bootstrapEmptyDatabase(files);

let totalApplied = 0;
let totalSkipped = 0;
let touchedFiles = 0;

for (const file of patchFiles) {
  const sql = await fs.readFile(new URL(`../db/migrations/${file}`, import.meta.url), "utf8");
  const statements = splitStatements(sql);
  const result = await runStatements(file, statements, { quietSkip: true });

  if (result.applied > 0 || result.skipped > 0) {
    touchedFiles += 1;
  }
  totalApplied += result.applied;
  totalSkipped += result.skipped;

  if (result.applied > 0) {
    console.log(`APPLY ${file}: ${result.applied} statement(s)`);
  }
}

console.log(`Done. Applied ${totalApplied} statement(s), skipped ${totalSkipped} duplicate/existing statement(s), checked ${touchedFiles} migration file(s).`);
