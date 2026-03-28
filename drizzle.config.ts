import * as dotenv from "dotenv";

dotenv.config();

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  throw new Error("Missing TURSO_DATABASE_URL environment variable");
}

if (!authToken) {
  throw new Error("Missing TURSO_AUTH_TOKEN environment variable");
}

const config = {
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dialect: "sqlite",
  dbCredentials: {
    url,
    authToken,
  },
};

export default config;
