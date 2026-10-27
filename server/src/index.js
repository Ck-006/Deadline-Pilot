import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { connectDatabase } from './config/db.js'

const serverDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
dotenv.config({ path: path.join(serverDir, '.env') })

function validateConfiguration() {
  const missing = ['MONGODB_URI', 'JWT_SECRET', 'CLIENT_URL'].filter((key) => !process.env[key]?.trim())
  if (missing.length) throw new Error(`Missing required server configuration: ${missing.join(', ')}.`)
  if (process.env.JWT_SECRET.length < 32) throw new Error('JWT_SECRET must contain at least 32 characters.')
  let clientOrigin
  try {
    const parsed = new URL(process.env.CLIENT_URL)
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error()
    clientOrigin = parsed.origin
  } catch {
    throw new Error('CLIENT_URL must be an HTTP or HTTPS origin.')
  }
  process.env.CLIENT_URL = clientOrigin
}

async function start() {
  try {
    validateConfiguration()
    const { default: app } = await import('./app.js')
    await connectDatabase()
    const port = Number(process.env.PORT || 5000)
    if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be a valid TCP port.')
    app.listen(port, '0.0.0.0', () => console.info(`DeadlinePilot API listening on port ${port}.`))
  } catch (error) {
    const message = error.message.startsWith('Missing required') || error.message.startsWith('JWT_SECRET') || error.message.startsWith('CLIENT_URL') || error.message.startsWith('PORT')
      ? error.message
      : `MongoDB connection failed (${error.name || 'connection error'}). Check MONGODB_URI and Atlas network access.`
    console.error(`DeadlinePilot startup failed: ${message}`)
    process.exitCode = 1
  }
}

await start()
