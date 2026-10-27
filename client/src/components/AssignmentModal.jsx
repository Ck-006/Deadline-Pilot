import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { api, localDateTime } from '../api.js'

const blank = { title: '', description: '', course: '', dueAt: '', estimatedHours: '', priority: 'medium', status: 'pending' }

export default function AssignmentModal({ assignment, onClose, onSaved }) {
  const [values, setValues] = useState(blank)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (assignment) setValues({ ...assignment, dueAt: localDateTime(assignment.dueAt), estimatedHours: assignment.estimatedHours ?? '' })
  }, [assignment])

  function change(event) { setValues((current) => ({ ...current, [event.target.name]: event.target.value })) }

  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    const body = { ...values, dueAt: new Date(values.dueAt).toISOString(), estimatedHours: values.estimatedHours === '' ? null : Number(values.estimatedHours) }
    try {
      await api(assignment ? `/assignments/${assignment._id}` : '/assignments', { method: assignment ? 'PATCH' : 'POST', body })
      await onSaved()
      onClose()
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <header className="modal-head"><div><span className="eyebrow">{assignment ? 'KEEP IT CURRENT' : 'MAKE A PLAN'}</span><h2 id="modal-title">{assignment ? 'Edit assignment' : 'Add an assignment'}</h2></div><button className="icon-button" onClick={onClose} aria-label="Close dialog"><X size={19} /></button></header>
        {error && <div className="alert error" role="alert">{error}</div>}
        <form className="assignment-form" onSubmit={submit}>
          <label className="span-2">Assignment title<input autoFocus required maxLength={120} name="title" value={values.title} onChange={change} placeholder="e.g. Research paper draft" /></label>
          <label>Course or subject<input required maxLength={80} name="course" value={values.course} onChange={change} placeholder="e.g. Psychology 201" /></label>
          <label>Due date & time<input type="datetime-local" required name="dueAt" value={values.dueAt} onChange={change} /></label>
          <label>Estimated effort <span className="label-hint">hours</span><input type="number" min="0" max="500" step="0.25" name="estimatedHours" value={values.estimatedHours} onChange={change} placeholder="Leave blank if unsure" /></label>
          <label>Priority<select name="priority" value={values.priority} onChange={change}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label>
          <label className="span-2">Notes <span className="label-hint">optional</span><textarea rows="3" maxLength={2000} name="description" value={values.description} onChange={change} placeholder="What should you remember about this assignment?" /></label>
          {assignment && <label>Status<select name="status" value={values.status} onChange={change}><option value="pending">In progress</option><option value="completed">Completed</option></select></label>}
          <div className="form-footer span-2"><p>Past due dates are allowed so you can track overdue work.</p><button className="button button-dark" disabled={busy}>{busy ? 'Saving…' : assignment ? 'Save changes' : 'Add to my list'}</button></div>
        </form>
      </section>
    </div>
  )
}
