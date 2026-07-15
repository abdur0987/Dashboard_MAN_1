# Turso Production Database

## Current project status

Database `dashboard-man1-lamsel-prod` has been created in the Turso account
`abdur0987`, its schema has been pushed, and the initial MAN 1 dataset has been
seeded. Local development currently connects to this database through
`.env.local`. Keep that file private and never commit its token.

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
```

For local testing against Turso, place them in `.env.local`.

## 3. Push schema

With the Turso variables available:

```bash
npm run db:push
```

For migration-file workflow:

```bash
npm run db:generate
npm run db:migrate
```

The app also runs an idempotent table check on startup, and the dashboard data is
seeded automatically when the database is empty.

## 4. Open Drizzle Studio

```bash
npm run db:studio
```

When Turso env vars are present, Drizzle Studio connects to the Turso database.
Without them, it connects to `data/dashboard.sqlite`.
