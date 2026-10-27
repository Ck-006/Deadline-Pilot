import test from 'node:test'
import assert from 'node:assert/strict'
import { createAssignmentSchema, updateAssignmentSchema, registerSchema, loginSchema } from '../src/validators/schemas.js'

test('assignment validation accepts overdue work and normalizes a blank estimate', () => {
  const parsed = createAssignmentSchema.parse({
    title: '  Lab report  ', course: 'Biology', dueAt: '2026-10-20T18:00:00.000Z', estimatedHours: '',
  })
  assert.equal(parsed.title, 'Lab report')
  assert.equal(parsed.estimatedHours, null)
  assert.equal(parsed.status, 'pending')
  assert.equal(parsed.priority, 'medium')
})

test('assignment validation rejects invalid dates, priorities, and negative effort', () => {
  const base = { title: 'Essay', course: 'History', dueAt: '2026-11-01T18:00:00.000Z' }
  assert.equal(createAssignmentSchema.safeParse({ ...base, dueAt: 'not-a-date' }).success, false)
  assert.equal(createAssignmentSchema.safeParse({ ...base, priority: 'critical' }).success, false)
  assert.equal(createAssignmentSchema.safeParse({ ...base, estimatedHours: -1 }).success, false)
})

test('partial assignment updates preserve omitted fields and reject an empty patch', () => {
  const parsed = updateAssignmentSchema.parse({ status: 'completed' })
  assert.deepEqual(parsed, { status: 'completed' })
  assert.equal(updateAssignmentSchema.safeParse({}).success, false)
})

test('registration normalizes email and enforces a longer password', () => {
  const parsed = registerSchema.parse({ name: 'Student Name', email: 'STUDENT@example.com', password: 'long-safe-pass' })
  assert.equal(parsed.email, 'student@example.com')
  assert.equal(registerSchema.safeParse({ name: 'Student', email: 'a@b.com', password: 'short' }).success, false)
})

test('login accepts only credential fields and rejects the signup-only name', () => {
  const parsed = loginSchema.parse({ email: 'STUDENT@example.com', password: 'existing-password' })
  assert.deepEqual(parsed, { email: 'student@example.com', password: 'existing-password' })
  assert.equal(loginSchema.safeParse({ email: 'student@example.com', password: 'existing-password', name: '' }).success, false)
})
