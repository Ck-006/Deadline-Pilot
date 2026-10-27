import mongoose from 'mongoose'
import { AppError } from '../utils.js'

export function requireDatabase(_req, _res, next) {
  if (mongoose.connection.readyState !== 1) {
    return next(new AppError(503, 'DATABASE_UNAVAILABLE', 'Database is not connected. Configure MONGODB_URI and make sure Atlas allows this network.'))
  }
  return next()
}
