const priorityWeight = { low: 0, medium: 1, high: 2 }

/**
 * Produces a stable score and explanation for each pending assignment.
 * Earlier due dates raise urgency, high priority raises the score, and more
 * remaining effort adds weight. Missing estimates get a small neutral effort.
 */
export function prioritizeAssignments(assignments, now = new Date()) {
  const current = now instanceof Date ? now.getTime() : new Date(now).getTime()
  return assignments
    .filter((item) => item.status !== 'completed')
    .map((item) => {
      const rawDue = item.dueAt ?? item.dueDate
      const dueMs = rawDue instanceof Date ? rawDue.getTime() : new Date(rawDue).getTime()
      const validDue = Number.isFinite(dueMs)
      const daysLeft = validDue ? (dueMs - current) / 86_400_000 : Infinity
      const overdue = validDue && daysLeft < 0
      const hours = Number(item.estimatedHours)
      const hasEstimate = Number.isFinite(hours) && hours > 0
      const effort = hasEstimate ? Math.min(hours, 40) : 1
      const priority = priorityWeight[item.priority] ?? priorityWeight.medium
      const urgency = !validDue ? 0 : overdue ? 100 + Math.min(Math.abs(daysLeft), 30) : Math.max(0, 30 - daysLeft) * 2
      const score = Math.round((urgency + effort * 1.5 + priority * 8) * 100) / 100
      let reason
      if (!validDue) reason = 'Add a valid due date to calculate deadline urgency.'
      else if (overdue) reason = `Overdue by ${Math.max(1, Math.floor(Math.abs(daysLeft)))} day${Math.floor(Math.abs(daysLeft)) === 1 ? '' : 's'}; clear this as soon as possible.`
      else if (daysLeft <= 2) reason = 'Due very soon; make this your next focus.'
      else if (!hasEstimate) reason = 'Deadline is approaching; add an effort estimate for a sharper plan.'
      else if (priority === 2) reason = 'High priority with work still remaining.'
      else if (hours >= 4) reason = 'A larger piece of work; start early to leave room to finish.'
      else reason = 'Keep this moving before the deadline gets closer.'
      return { assignment: item, score, overdue, daysLeft, reason }
    })
    .sort((a, b) => b.score - a.score || (a.daysLeft - b.daysLeft) || String(a.assignment._id ?? a.assignment.id ?? '').localeCompare(String(b.assignment._id ?? b.assignment.id ?? '')))
}

export function sortAssignmentsByUrgency(assignments, now = new Date()) {
  const ranked = prioritizeAssignments(assignments, now)
  const ranks = new Map(ranked.map((item, index) => [String(item.assignment._id ?? item.assignment.id ?? ''), index]))
  const time = now instanceof Date ? now.getTime() : new Date(now).getTime()
  return [...assignments].sort((a, b) => {
    const aRank = ranks.get(String(a._id ?? a.id ?? ''))
    const bRank = ranks.get(String(b._id ?? b.id ?? ''))
    if (aRank !== undefined || bRank !== undefined) return (aRank ?? Number.MAX_SAFE_INTEGER) - (bRank ?? Number.MAX_SAFE_INTEGER)
    const aDue = new Date(a.dueAt ?? a.dueDate).getTime()
    const bDue = new Date(b.dueAt ?? b.dueDate).getTime()
    const aTime = Number.isFinite(aDue) ? aDue : time + Number.MAX_SAFE_INTEGER
    const bTime = Number.isFinite(bDue) ? bDue : time + Number.MAX_SAFE_INTEGER
    return aTime - bTime
  })
}

export function buildDashboard(assignments, now = new Date()) {
  const pending = assignments.filter((a) => a.status !== 'completed')
  const completed = assignments.filter((a) => a.status === 'completed')
  const timestamp = now instanceof Date ? now.getTime() : new Date(now).getTime()
  const overdue = pending.filter((a) => {
    const due = new Date(a.dueAt ?? a.dueDate).getTime()
    return Number.isFinite(due) && due < timestamp
  })
  const upcoming = pending
    .filter((a) => {
      const due = new Date(a.dueAt ?? a.dueDate).getTime()
      return Number.isFinite(due) && due >= timestamp
    })
    .sort((a, b) => new Date(a.dueAt ?? a.dueDate) - new Date(b.dueAt ?? b.dueDate))
    .slice(0, 5)
  return {
    counts: { total: assignments.length, pending: pending.length, completed: completed.length, overdue: overdue.length },
    completionRate: assignments.length ? Math.round(completed.length / assignments.length * 100) : 0,
    upcoming,
    recommendations: prioritizeAssignments(assignments, now).slice(0, 3),
  }
}
