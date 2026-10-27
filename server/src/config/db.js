import mongoose from 'mongoose'

export async function connectDatabase(uri = process.env.MONGODB_URI) {
  if (!uri || uri.startsWith('your_')) {
    console.warn('MongoDB is not configured. Add MONGODB_URI to server/.env to enable persisted API workflows.')
    return false
  }
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 })
  console.info('Connected to MongoDB.')
  return true
}
