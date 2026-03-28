import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { createClient } from "@libsql/client";

dotenv.config({ path: ".env.local" });
dotenv.config();

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  throw new Error("Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN");
}

const client = createClient({ url, authToken });
const email = "admin@manggala.co.id";
const password = "Admin123!";
const passwordHash = await bcrypt.hash(password, 10);

const existing = await client.execute({ sql: "select id from users where email = ?", args: [email] });
if (existing.rows.length === 0) {
  await client.execute({
    sql: "insert into users (name, email, password_hash, role, created_at) values (?, ?, ?, ?, ?)",
    args: ["Admin Ops", email, passwordHash, "admin", new Date().toISOString()],
  });
  console.log(`Seeded default admin: ${email} / ${password}`);
} else {
  console.log(`Admin user already exists: ${email}`);
}
