import 'dotenv/config'
import postgres from 'postgres'

const sql = postgres(process.env.DATABASE_URL!, { max: 1 })

// Dev-only reset: drops every table in public + the drizzle migrations
// journal schema, so `db:migrate` reapplies everything from scratch.
await sql`DROP SCHEMA public CASCADE`
await sql`CREATE SCHEMA public`
await sql`DROP SCHEMA IF EXISTS drizzle CASCADE`

console.log('public + drizzle schemas dropped and recreated')

await sql.end()
