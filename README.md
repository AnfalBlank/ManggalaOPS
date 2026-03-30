# ManggalaOPS

ERP/CRM dashboard untuk PT. Manggala Utama Indonesia, dibangun dengan Next.js, Drizzle ORM, dan Turso/libSQL.

## Fitur Utama

- Manajemen client, lead, project
- Quotation & invoice dengan perhitungan PPN
- Finance & expense tracking
- Accounting, journal, dan tax report
- Internal chat dan notifikasi

## Kebutuhan

- Node.js 20+
- npm
- Database Turso/libSQL

## Setup Environment

1. Copy file contoh env:

```bash
cp .env.local.example .env.local
```

2. Isi `.env.local`:

```env
TURSO_DATABASE_URL=libsql://your-database-name.turso.io
TURSO_AUTH_TOKEN=your_turso_auth_token
```

## Instalasi

```bash
npm install
```

## Jalankan Lokal

```bash
npm run dev
```

App akan tersedia di:
- <http://localhost:3000>

## Setup Database

### Untuk database yang sudah pernah dipakai
Gunakan patch migration aman:

```bash
npm run db:apply
```

Script ini sekarang:
- membedakan bootstrap DB kosong vs patch DB existing
- memakai migration journal
- tidak mengulang file migration yang sudah pernah diproses

### Untuk database baru / kosong
Tetap bisa pakai:

```bash
npm run db:apply
```

### Opsional
Generate drizzle artifacts:

```bash
npm run db:generate
```

Push schema via drizzle:

```bash
npm run db:push
```

Buka Drizzle Studio:

```bash
npm run db:studio
```

## Seed Data

Kalau database masih kosong:

```bash
npm run dev
# terminal lain
curl -X POST http://localhost:3000/api/seed
```

## Script yang Tersedia

- `npm run dev` — jalankan local dev server
- `npm run build` — production build
- `npm run start` — jalankan production server
- `npm run lint` — ESLint
- `npm run db:generate` — generate drizzle artifacts
- `npm run db:check` — cek drift schema
- `npm run db:push` — push schema via drizzle
- `npm run db:apply` — apply migration SQL lokal dengan journal
- `npm run db:up` — drizzle up
- `npm run db:studio` — buka Drizzle Studio

## Catatan Repo

- File `.env*` tidak ikut git
- File database lokal (`*.db`) di-ignore
- Repo ini memakai GitHub private untuk source utama

## Catatan Teknis

- PPN Keluaran diambil dari invoice
- PPN Masukan diambil dari expense/pembelian taxable
- Quotation tidak dihitung sebagai objek final di laporan pajak
