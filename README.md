# ManggalaOPS

ERP/CRM dashboard for PT. Manggala Utama Indonesia built with Next.js, Drizzle ORM, and Turso/libSQL.

## Requirements

- Node.js 20+
- npm
- Turso database URL and auth token

## Environment Setup

1. Copy the example env file:

```bash
cp .env.local.example .env.local
```

2. Fill in these values in `.env.local`:

```env
TURSO_DATABASE_URL=libsql://your-database-name.turso.io
TURSO_AUTH_TOKEN=your_turso_auth_token
```

## Database Setup

Push the schema to Turso:

```bash
npm run db:push
```

(Optional) generate migration files:

```bash
npm run db:generate
```

Seed starter data:

```bash
npm run dev
# in another terminal
curl -X POST http://localhost:3000/api/seed
```

## Run Locally

```bash
npm install
npm run dev
```

Open <http://localhost:3000>

## Available Scripts

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run start` — run production server
- `npm run lint` — run ESLint
- `npm run db:generate` — generate drizzle artifacts
- `npm run db:migrate` — run drizzle migrations
- `npm run db:push` — push schema to Turso/libSQL
- `npm run db:studio` — open Drizzle Studio

## API Endpoints

- `GET /api/health`
- `GET /api/dashboard`
- `GET /api/leads`
- `GET /api/projects`
- `GET /api/quotations`
- `GET /api/invoices`
- `GET /api/payments`
- `POST /api/seed`

## Notes

- The app requires `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` for build/runtime.
- Main operational pages already read live data from Drizzle queries.
- If the database is empty, run the seed endpoint once.
