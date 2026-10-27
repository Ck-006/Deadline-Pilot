import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import mongoose from 'mongoose'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import authRoutes from './routes/authRoutes.js'
import assignmentRoutes from './routes/assignmentRoutes.js'
import { requireDatabase } from './middleware/database.js'
import { AppError } from './utils.js'

const app = express()
const allowedOrigin = process.env.CLIENT_URL
app.disable('x-powered-by')
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
app.use(cors({ origin: allowedOrigin, credentials: true }))
app.use(express.json({ limit: '20kb' }))
app.use(cookieParser())

app.get('/api/health', (_req, res) => res.json({ success: true, data: { status: 'ok', database: mongoose.connection.readyState === 1 ? 'connected' : 'not_connected' } }))
app.use('/api/auth', authRoutes)
app.use('/api/assignments', requireDatabase, assignmentRoutes)

const thisFile = fileURLToPath(import.meta.url)
const serverRoot = path.resolve(path.dirname(thisFile), '../..')
const clientDist = path.join(serverRoot, 'client', 'dist')
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(clientDist))
  app.get('*splat', (req, res, next) => req.path.startsWith('/api/') ? next() : res.sendFile(path.join(clientDist, 'index.html')))
}

app.use((req, _res, next) => next(new AppError(404, 'NOT_FOUND', `No route found for ${req.method} ${req.path}.`)))
app.use((error, _req, res, _next) => {
  if (res.headersSent) return
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, error: { code: 'INVALID_JSON', message: 'Request body must be valid JSON.' } })
  }
  const status = error.status || (error.name === 'ValidationError' ? 400 : 500)
  const code = error.code && typeof error.code === 'string' ? error.code : error.name === 'ValidationError' ? 'VALIDATION_ERROR' : 'SERVER_ERROR'
  const message = status >= 500 && code === 'SERVER_ERROR' ? 'Something went wrong. Please try again.' : error.message
  if (status >= 500) console.error('Request failed:', error.message)
  res.status(status).json({ success: false, error: { code, message, ...(error.details ? { details: error.details } : {}) } })
})

export default app
