import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '/var/www/crmmanggala/.env' });

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const migrationsDir = '/var/www/crmmanggala/db/migrations';
const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

for (const file of files) {
  console.log(`Running: ${file}`);
  const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
  const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0 && !s.startsWith('-->'));
  
  for (const stmt of statements) {
    try {
      await db.execute(stmt);
    } catch (e) {
      if (e.message.includes('already exists')) {
        console.log(`  Skip (exists): ${stmt.substring(0, 60)}...`);
      } else {
        console.error(`  Error: ${e.message}`);
      }
    }
  }
  console.log(`  Done: ${file}`);
}

console.log('All migrations complete!');
