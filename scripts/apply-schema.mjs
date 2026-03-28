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

const sql = await fs.readFile(new URL("../db/migrations/0000_massive_brood.sql", import.meta.url), "utf8");
const statements = sql
  .split("--> statement-breakpoint")
  .map((statement) => statement.trim())
  .filter(Boolean);

const client = createClient({ url, authToken });

for (const statement of statements) {
  await client.execute(statement);
}

console.log(`Applied ${statements.length} statements successfully.`);
