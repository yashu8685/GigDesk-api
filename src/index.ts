import { createApp } from './app.js'
import { env } from './config/env.js'

const app = createApp()

const server = app.listen(env.PORT, '0.0.0.0', () => {
  console.log(
    `[api.gigdesk] listening on http://0.0.0.0:${env.PORT} (${env.NODE_ENV})`,
  )
})

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    server.close(() => process.exit(0))
  })
}
