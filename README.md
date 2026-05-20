# ManggalaOPS

ERP/CRM internal untuk PT. Manggala Utama Indonesia. Stack: Next.js 16 (App Router + Turbopack), Drizzle ORM, libSQL/Turso.

## Modul Utama

- Client, Lead, Project tracking
- Quotation, Invoice, Surat Jalan (Delivery Order), Kwitansi — semua punya format PDF konsisten
- Finance & Expense (auto-journal double entry)
- Accounting (COA, Journal, Trial Balance, Tax Report)
- Internal Chat & Notifikasi
- Audit log untuk operasi destructive
- Login dengan rate limit, password kebijakan minimal 8 karakter

## Kebutuhan

- Node.js 20+
- npm
- Database libSQL/Turso

## Setup Environment

```bash
cp .env.local.example .env.local
```

Isi `.env.local`:

```env
TURSO_DATABASE_URL=libsql://your-database-name.turso.io
TURSO_AUTH_TOKEN=your_turso_auth_token
# Optional, only for ops emergency tools
# MANGGALA_ALLOW_RESET=true
# MANGGALA_ALLOW_SEED=true
```

## Instalasi

```bash
npm install
```

## Jalankan Lokal

```bash
npm run dev
```

App akan tersedia di <http://localhost:3000>.

## Database

```bash
# patch / bootstrap aman dengan migration journal
npm run db:apply

# helper drizzle
npm run db:generate
npm run db:check
npm run db:push
npm run db:studio
```

## Seed Data

Hanya berjalan di non-production:

```bash
npm run dev
# di terminal lain
curl -X POST http://localhost:3000/api/seed -b "manggala_session=..."
```

Anda harus login dulu sebagai admin agar request seed diterima.

## Script

| Script | Fungsi |
|--------|--------|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run start` | Production server |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:apply` | Apply migration aman pakai journal |
| `npm run db:generate` | Generate drizzle artifacts |
| `npm run db:check` | Cek drift schema |
| `npm run db:push` | Push schema |
| `npm run db:studio` | Drizzle Studio |

## Format Surat (PDF)

Semua dokumen menyajikan layout konsisten: header banner biru, blok pengirim & penerima, tabel item kuning emas, footer banner dengan info kontak & nomor halaman.

- **Quotation** — `QUO-####` dengan nomor surat `MUI/SP/Roman/Year`
- **Invoice** — `INV-####` dengan nomor surat `MUI/INV/Roman/Year`
- **Surat Jalan** — `SJ-####` dengan nomor surat `MUI/SJ/Roman/Year` (auto-generate dari invoice tersedia)
- **Kwitansi** — `KWT-PAY-####`

## Catatan Pajak

- PPN Keluaran diambil dari invoice
- PPN Masukan diambil dari expense/pembelian taxable
- Quotation tidak dihitung sebagai objek final di laporan pajak

## Repo Standards

- License: Proprietary / internal use only
- CI: GitHub Actions build check on push & pull request
- Issue / PR templates tersedia
- Tabel `audit_log` mencatat setiap operasi sensitif
