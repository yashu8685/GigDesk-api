import 'dotenv/config'
import { and, eq } from 'drizzle-orm'
import argon2 from 'argon2'
import { db } from '../src/db/client.js'
import { users } from '../src/db/schemas/index.js'

const email = process.argv[2]?.toLowerCase().trim()
const password = process.argv[3]
const fullName = process.argv[4] ?? 'GigDesk Admin'

if (!email || !password || password.length < 8) {
  console.error(
    'Usage: npm run admin:create -- <email> <password-min-8-chars> [full-name]',
  )
  process.exit(1)
}

const passwordHash = await argon2.hash(password)

const [existing] = await db
  .select({ id: users.id })
  .from(users)
  .where(and(eq(users.email, email), eq(users.userType, 'admin')))
  .limit(1)

if (existing) {
  await db
    .update(users)
    .set({ passwordHash, fullName })
    .where(eq(users.id, existing.id))
  console.log(`Admin password updated for ${email}`)
} else {
  await db.insert(users).values({
    userType: 'admin',
    status: 'active',
    email,
    passwordHash,
    fullName,
  })
  console.log(`Admin created: ${email}`)
}

process.exit(0)
