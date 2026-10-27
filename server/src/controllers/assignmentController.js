import mongoose from 'mongoose'
import Assignment from '../models/Assignment.js'
import { buildDashboard, sortAssignmentsByUrgency } from '../services/prioritization.js'
import { AppError, sendData } from '../utils.js'
import { createAssignmentSchema, updateAssignmentSchema } from '../validators/schemas.js'

function parse(schema, body) {
  const result = schema.safeParse(body)
  if (!result.success) throw new AppError(400, 'VALIDATION_ERROR', 'Check the assignment fields and try again.', result.error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message })))
  return result.data
}

function validId(id) {
  if (!mongoose.isValidObjectId(id)) throw new AppError(404, 'NOT_FOUND', 'Assignment not found.')
}

export async function listAssignments(req, res) {
  const query = { user: req.user._id }
  if (['pending', 'completed'].includes(req.query.status)) query.status = req.query.status
  if (['low', 'medium', 'high'].includes(req.query.priority)) query.priority = req.query.priority
  const search = typeof req.query.search === 'string' ? req.query.search.trim().slice(0, 100) : ''
  if (search) query.$or = [
    { title: { $regex: escapeRegex(search), $options: 'i' } },
    { course: { $regex: escapeRegex(search), $options: 'i' } },
  ]
  let assignments = await Assignment.find(query).sort(req.query.sort === 'urgency' ? {} : { dueAt: 1 }).lean()
  if (req.query.sort === 'urgency') assignments = sortAssignmentsByUrgency(assignments)
  return sendData(res, { assignments })
}

export async function dashboard(req, res) {
  const assignments = await Assignment.find({ user: req.user._id }).sort({ dueAt: 1 }).lean()
  return sendData(res, buildDashboard(assignments))
}

export async function createAssignment(req, res) {
  const input = parse(createAssignmentSchema, req.body)
  const assignment = await Assignment.create({ ...input, user: req.user._id })
  return sendData(res, { assignment }, 201)
}

export async function getAssignment(req, res) {
  validId(req.params.id)
  const assignment = await Assignment.findOne({ _id: req.params.id, user: req.user._id })
  if (!assignment) throw new AppError(404, 'NOT_FOUND', 'Assignment not found.')
  return sendData(res, { assignment })
}

export async function updateAssignment(req, res) {
  validId(req.params.id)
  const input = parse(updateAssignmentSchema, req.body)
  const assignment = await Assignment.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id }, input,
    { new: true, runValidators: true }
  )
  if (!assignment) throw new AppError(404, 'NOT_FOUND', 'Assignment not found.')
  return sendData(res, { assignment })
}

export async function deleteAssignment(req, res) {
  validId(req.params.id)
  const assignment = await Assignment.findOneAndDelete({ _id: req.params.id, user: req.user._id })
  if (!assignment) throw new AppError(404, 'NOT_FOUND', 'Assignment not found.')
  return sendData(res, { message: 'Assignment deleted.' })
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
