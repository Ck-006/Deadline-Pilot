import test from 'node:test'
import assert from 'node:assert/strict'
import { buildDashboard, prioritizeAssignments, sortAssignmentsByUrgency } from '../src/services/prioritization.js'

const now = new Date('2026-10-27T12:00:00.000Z')
const assignment = (id, changes = {}) => ({ _id: id, title: id, dueAt: '2026-10-30T12:00:00.000Z', status: 'pending', priority: 'medium', estimatedHours: 2, ...changes })

test('prioritization ranks overdue work above future work and skips completed work', () => {
  const result = prioritizeAssignments([
    assignment('future'),
    assignment('late', { dueAt: '2026-10-25T12:00:00.000Z' }),
    assignment('done', { status: 'completed', dueAt: '2026-10-26T12:00:00.000Z' }),
  ], now)
  assert.deepEqual(result.map((item) => item.assignment._id), ['late', 'future'])
  assert.equal(result[0].overdue, true)
  assert.match(result[0].reason, /Overdue/)
})

test('priority and substantial effort affect ranking; missing dates remain safe', () => {
  const result = prioritizeAssignments([
    assignment('normal', { dueAt: '2026-10-28T12:00:00.000Z', priority: 'low', estimatedHours: 1 }),
    assignment('high', { dueAt: '2026-10-28T12:00:00.000Z', priority: 'high', estimatedHours: 8 }),
    assignment('invalid-date', { dueAt: 'not-a-date', estimatedHours: null }),
  ], now)
  assert.equal(result[0].assignment._id, 'high')
  assert.equal(result.at(-1).assignment._id, 'invalid-date')
  assert.match(result.at(-1).reason, /valid due date/)
})

test('dashboard counts completion and overdue records and exposes progress', () => {
  const result = buildDashboard([
    assignment('late', { dueAt: '2026-10-25T12:00:00.000Z' }),
    assignment('done', { status: 'completed' }),
    assignment('soon', { dueAt: '2026-10-28T12:00:00.000Z' }),
  ], now)
  assert.deepEqual(result.counts, { total: 3, pending: 2, completed: 1, overdue: 1 })
  assert.equal(result.completionRate, 33)
  assert.equal(result.upcoming[0]._id, 'soon')
})

test('urgency sorting shares recommendation scores and places completed work last', () => {
  const result = sortAssignmentsByUrgency([
    assignment('low', { dueAt: '2026-10-28T12:00:00.000Z', priority: 'low', estimatedHours: 1 }),
    assignment('overdue', { dueAt: '2026-10-25T12:00:00.000Z' }),
    assignment('complete', { status: 'completed', dueAt: '2026-10-26T12:00:00.000Z' }),
    assignment('high', { dueAt: '2026-10-28T12:00:00.000Z', priority: 'high', estimatedHours: 8 }),
  ], now)
  assert.deepEqual(result.map((item) => item._id), ['overdue', 'high', 'low', 'complete'])
})
