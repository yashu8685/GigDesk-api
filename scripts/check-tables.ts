import 'dotenv/config'
import postgres from 'postgres'

const sql = postgres(process.env.DATABASE_URL!, { max: 1 })

const rows = await sql<{ table_name: string }[]>`
  select table_name from information_schema.tables
  where table_schema = 'public' order by table_name
`
console.log(rows.map((r) => r.table_name).join('\n'))

await sql.end()
