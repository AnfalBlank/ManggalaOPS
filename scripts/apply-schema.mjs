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
const migrationFiles = (await fs.readdir(migrationsDir))
  .filter((name) => name.endsWith('.sql'))
  .sort();

const client = createClient({ url, authToken });
let appliedStatements = 0;

for (const file of migrationFiles) {
  const sql = await fs.readFile(new URL(`../db/migrations/${file}`, import.meta.url), 'utf8');
  const statements = sql
    .split(/--> statement-breakpoint|;\s*\n/)
    .map((statement) => statement.trim())
    .filter(Boolean);

  for (const statement of statements) {
    try {
      await client.execute(statement);
      appliedStatements += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes('already exists') || message.includes('duplicate column name')) {
        console.log(`Skip ${file}: ${message}`);
        continue;
      }
      throw error;
    }
  }
}

console.log(`Applied ${appliedStatements} statements successfully.`);
