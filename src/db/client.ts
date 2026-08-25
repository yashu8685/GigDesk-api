import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { env } from '../config/env.js'
import * as schema from './schemas/index.js'

/**
 * The single database caller of the whole project. Nothing else —
 * not the web admin, not the mobile app — may touch Postgres directly.
 */
const client = postgres(env.DATABASE_URL, {
  max: 5,
  idle_timeout: 20,
  connect_timeout: 10,
})

export const db = drizzle(client, { schema })
export { client }
