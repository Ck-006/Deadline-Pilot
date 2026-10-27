import mongoose from 'mongoose'

const assignmentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, trim: true, maxlength: 2000, default: '' },
  course: { type: String, required: true, trim: true, maxlength: 80 },
  dueAt: { type: Date, required: true },
  estimatedHours: { type: Number, min: 0, max: 500, default: null },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
}, { timestamps: true })

assignmentSchema.index({ user: 1, dueAt: 1 })
export default mongoose.model('Assignment', assignmentSchema)
