import { sql } from 'drizzle-orm'
import { db } from '../../db/client.js'
import { jobs, users } from '../../db/schemas/index.js'

export async function getLocations() {
  const [citiesUsers, citiesJobs, districtsUsers, districtsJobs, areasUsers, areasJobs] = await Promise.all([
    db.selectDistinct({ value: users.city }).from(users).where(sql`${users.city} IS NOT NULL AND ${users.city} <> ''`),
    db.selectDistinct({ value: jobs.city }).from(jobs).where(sql`${jobs.city} IS NOT NULL AND ${jobs.city} <> ''`),
    db.selectDistinct({ value: users.district }).from(users).where(sql`${users.district} IS NOT NULL AND ${users.district} <> ''`),
    db.selectDistinct({ value: jobs.district }).from(jobs).where(sql`${jobs.district} IS NOT NULL AND ${jobs.district} <> ''`),
    db.selectDistinct({ value: users.area }).from(users).where(sql`${users.area} IS NOT NULL AND ${users.area} <> ''`),
    db.selectDistinct({ value: jobs.area }).from(jobs).where(sql`${jobs.area} IS NOT NULL AND ${jobs.area} <> ''`),
  ])

  const cities = [...new Set([...citiesUsers.map((r) => r.value!), ...citiesJobs.map((r) => r.value!)].filter(Boolean))].sort()
  const districts = [...new Set([...districtsUsers.map((r) => r.value!), ...districtsJobs.map((r) => r.value!)].filter(Boolean))].sort()
  const areas = [...new Set([...areasUsers.map((r) => r.value!), ...areasJobs.map((r) => r.value!)].filter(Boolean))].sort()

  return { cities, districts, areas }
}
