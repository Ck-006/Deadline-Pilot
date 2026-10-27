import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { AppError } from '../utils.js'

export function requireJwtSecret(_req, _res, next) {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    return next(new AppError(503, 'AUTH_NOT_CONFIGURED', 'Authentication is not configured. Set a JWT_SECRET of at least 32 characters.'))
  }
  return next()
}

export const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000,
})

export async function requireAuth(req, _res, next) {
  const token = req.cookies?.deadlinepilot_token
  if (!token) return next(new AppError(401, 'AUTH_REQUIRED', 'Please sign in to continue.'))
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    return next(new AppError(503, 'AUTH_NOT_CONFIGURED', 'Authentication is not configured. Set a JWT_SECRET of at least 32 characters.'))
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(payload.sub).select('_id name email')
    if (!user) return next(new AppError(401, 'AUTH_REQUIRED', 'Your session has expired. Please sign in again.'))
    req.user = user
    return next()
  } catch {
    return next(new AppError(401, 'AUTH_REQUIRED', 'Your session has expired. Please sign in again.'))
  }
}

export function issueToken(user) {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new AppError(503, 'AUTH_NOT_CONFIGURED', 'Authentication is not configured. Set a JWT_SECRET of at least 32 characters.')
  }
  return jwt.sign({ sub: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: '7d' })
}
