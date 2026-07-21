# Turso Production Database

## Current project status

Database target is `dashboard-man1-lamsel-prod` in the Turso account
`abdur0987`. It may appear as a branch of the previous database when it was
created with `--from-db`; do not delete either database until deployment,
snapshot migration, and rollback have been verified. Keep `.env.local` private
and never commit its token.

The previous `dashboard-man1-prod` database is retained temporarily as a
rollback source. Do not delete it until the new connection has also been
verified in the deployment environment.

This app uses local SQLite in development and switches to Turso/libSQL in production
when `TURSO_DATABASE_URL` is present.

## 1. Create or recreate the Turso database

Install and log in to the Turso CLI:

```bash
brew install tursodatabase/tap/turso
turso auth login
```

Create a production database:

```bash
turso db create dashboard-man1-lamsel-prod
```

Get the database URL and token:

```bash
turso db show dashboard-man1-lamsel-prod --url
turso db tokens create dashboard-man1-lamsel-prod
```

## 2. Configure environment variables

Set these variables in production:

```bash
TURSO_DATABASE_URL=libsql://...
TURSO_AUTH_TOKEN=...
BETTER_AUTH_URL=https://your-production-domain.example
BETTER_AUTH_SECRET=replace-with-a-long-random-secret
NEXT_PUBLIC_BETTER_AUTH_URL=https://your-production-domain.example
ADMIN_EMAILS=admin@example.org
```

For local testing against Turso, place them in `.env.local`.

## 3. Backup dan migrasi schema

Sebelum migrasi, export snapshot dan pastikan hasilnya lolos integrity check:

```bash
turso db export dashboard-man1-lamsel-prod --output-file data/backups/dashboard-man1-lamsel-prod-pre-migrate.db
sqlite3 data/backups/dashboard-man1-lamsel-prod-pre-migrate.db 'PRAGMA integrity_check;'
```

Kemudian jalankan migration-file workflow:

```bash
npm run db:generate
npm run db:migrate
```

Migration awal menggunakan `IF NOT EXISTS` agar aman pada database yang sudah
memiliki tabel dashboard lama. Jangan memakai `db:push` untuk cutover produksi.

The app also runs an idempotent table check on startup. Initial verified EMIS
and SIMPEG observations are stored as aggregate snapshots when the snapshot
tables are empty; no credential or raw upstream payload is stored.

## 4. Open Drizzle Studio

```bash
npm run db:studio
```

When Turso env vars are present, Drizzle Studio connects to the Turso database.
Without them, it connects to `data/dashboard.sqlite`.
