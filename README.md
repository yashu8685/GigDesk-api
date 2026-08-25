# api.gigdesk

Backend API for GigDesk — the **only** component that talks to the database.

## Stack

- Node + Express 5, TypeScript (strict)
- PostgreSQL (Neon) via Drizzle ORM (`postgres` driver)
- Zod validation on every server input
- Central error boundary: every async route wrapped, no naked awaits

## Setup

```bash
npm install
cp .env.example .env   # fill in DATABASE_URL (Neon), PORT, CORS_ORIGINS
npm run dev            # http://localhost:4000
```

## Scripts

| Script             | What it does                          |
| ------------------ | ------------------------------------- |
| `npm run dev`      | Dev server with watch (tsx)           |
| `npm run build`    | Compile to `dist/`                    |
| `npm run typecheck`| Strict typecheck                      |
| `npm run db:generate` | Generate Drizzle migrations from schema |
| `npm run db:migrate`  | Apply migrations to the database    |
| `npm run db:studio`   | Drizzle Studio (DB browser)         |

## Layout

```
src/
  config/env.ts        # zod-validated environment
  db/schema.ts         # Drizzle schema (empty until screens are agreed)
  db/client.ts         # the only DB caller
  middleware/          # asyncHandler + central error handler
  routes/health.ts     # GET /health
  app.ts               # express app wiring
  index.ts             # bootstrap
```

## Rules (from the project brief)

1. Schema is designed only after the approved screens (web + mobile) agree on
   what data each screen needs. Migrations come from drizzle-kit, never
   hand-written SQL.
2. Every route: Zod-validated input, try/catch boundary, module by module.
3. Secrets live only here — never in a browser or app bundle.
