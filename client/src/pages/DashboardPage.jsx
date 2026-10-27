import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertCircle, ArrowDownWideNarrow, ArrowRight, BookOpen, Check, CheckCircle2, Circle, Clock3, LayoutDashboard, LogOut, Plus, Search, SlidersHorizontal, Sparkles, Target, Trash2, TrendingUp, Pencil, CalendarDays } from 'lucide-react'
import { api, formatDue } from '../api.js'
import AssignmentModal from '../components/AssignmentModal.jsx'

const initialCounts = { total: 0, pending: 0, completed: 0, overdue: 0 }
const greeting = () => {
  const hour = new Date().getHours()
  return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
}

export default function DashboardPage({ user, onLogout }) {
  const [assignments, setAssignments] = useState([])
  const [dashboard, setDashboard] = useState({ counts: initialCounts, completionRate: 0, upcoming: [], recommendations: [] })
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [priority, setPriority] = useState('all')
  const [sort, setSort] = useState('due')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modal, setModal] = useState(null)
  const [toast, setToast] = useState('')
  const [logoutBusy, setLogoutBusy] = useState(false)

  const params = useMemo(() => {
    const search = new URLSearchParams()
    if (query.trim()) search.set('search', query.trim())
    if (status !== 'all') search.set('status', status)
    if (priority !== 'all') search.set('priority', priority)
    if (sort === 'urgency') search.set('sort', 'urgency')
    return search.toString()
  }, [query, status, priority, sort])

  const refresh = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true)
    setError('')
    try {
      const [list, summary] = await Promise.all([
        api(`/assignments${params ? `?${params}` : ''}`),
        api('/assignments/dashboard'),
      ])
      setAssignments(list.assignments)
      setDashboard(summary)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [params])

  useEffect(() => {
    const timer = window.setTimeout(() => refresh(true), query ? 200 : 0)
    return () => window.clearTimeout(timer)
  }, [refresh])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(''), 2800)
    return () => window.clearTimeout(timer)
  }, [toast])

  async function logout() {
    setLogoutBusy(true)
    try { await api('/auth/logout', { method: 'POST' }) } catch { /* Clear local session even if the network is unavailable. */ }
    onLogout()
  }

  async function toggleComplete(item) {
    try {
      await api(`/assignments/${item._id}`, { method: 'PATCH', body: { status: item.status === 'completed' ? 'pending' : 'completed' } })
      await refresh()
      setToast(item.status === 'completed' ? 'Moved back to in progress' : 'Nice work — marked complete')
    } catch (err) { setError(err.message) }
  }

  async function remove(item) {
    if (!window.confirm(`Delete “${item.title}”? This cannot be undone.`)) return
    try {
      await api(`/assignments/${item._id}`, { method: 'DELETE' })
      await refresh()
      setToast('Assignment deleted')
    } catch (err) { setError(err.message) }
  }

  const firstRecommendation = dashboard.recommendations?.[0]
  const firstId = firstRecommendation?.assignment?._id
  const recommendationItem = firstRecommendation?.assignment

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#top"><span className="brand-mark">dp</span><span>DeadlinePilot</span></a>
        <div className="side-caption">WORKSPACE</div>
        <a className="nav-link active" href="#top"><LayoutDashboard size={17} /> Overview</a>
        <a className="nav-link" href="#assignments"><BookOpen size={17} /> Assignments <span className="nav-count">{dashboard.counts.pending}</span></a>
        <div className="sidebar-note"><span className="note-icon"><Sparkles size={17} /></span><strong>One thing at a time.</strong><p>Small, steady progress adds up to a finished semester.</p></div>
        <div className="sidebar-bottom"><span className="avatar">{user.name.trim().charAt(0).toUpperCase()}</span><div className="profile-copy"><strong>{user.name}</strong><span>{user.email}</span></div><button className="icon-button logout-button" disabled={logoutBusy} onClick={logout} aria-label="Sign out" title="Sign out"><LogOut size={17} /></button></div>
      </aside>

      <main className="main-content" id="top">
        <header className="topbar"><div className="mobile-brand"><span className="brand-mark">dp</span><b>DeadlinePilot</b></div><div className="breadcrumb">Your workspace <span>/</span> Overview</div><div className="topbar-right"><span className="today-chip"><CalendarDays size={14} /> {new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date())}</span><span className="avatar small">{user.name.trim().charAt(0).toUpperCase()}</span><button className="icon-button top-logout" disabled={logoutBusy} onClick={logout} aria-label="Sign out" title="Sign out"><LogOut size={16} /></button></div></header>
        <div className="page-content">
          <section className="welcome-row"><div><div className="eyebrow">{greeting()}, {user.name.split(' ')[0]}</div><h1>Your semester, <em>in good hands.</em></h1><p>Here’s where things stand. Let’s make your next move a good one.</p></div><button className="button button-dark add-main" onClick={() => setModal({ mode: 'create' })}><Plus size={17} /> Add assignment</button></section>

          {error && <div className="alert error page-alert" role="alert"><AlertCircle size={17} />{error}<button onClick={() => refresh()} className="text-action">Try again</button></div>}

          <section className="stat-grid" aria-label="Assignment overview">
            <StatCard icon={<BookOpen size={17} />} label="All assignments" value={dashboard.counts.total} detail="across your courses" tone="sage" />
            <StatCard icon={<Circle size={17} />} label="In progress" value={dashboard.counts.pending} detail="still on your list" tone="blue" />
            <StatCard icon={<CheckCircle2 size={17} />} label="Completed" value={dashboard.counts.completed} detail={`${dashboard.completionRate}% of your total`} tone="green" />
            <StatCard icon={<Clock3 size={17} />} label="Past due" value={dashboard.counts.overdue} detail={dashboard.counts.overdue ? 'needs a little attention' : 'you’re all caught up'} tone={dashboard.counts.overdue ? 'coral' : 'gold'} />
          </section>

          <section className="focus-row">
            <div className="focus-card">
              <div className="focus-top"><span className="focus-symbol"><Target size={19} /></span><span className="eyebrow">YOUR NEXT FOCUS</span><span className="focus-tag"><Sparkles size={13} /> Smart pick</span></div>
              {loading ? <div className="skeleton focus-skeleton" /> : recommendationItem ? <><div className="focus-title-row"><div><h2>{recommendationItem.title}</h2><p>{recommendationItem.course} <span>·</span> {formatDue(recommendationItem.dueAt, { weekday: 'short', month: 'short', day: 'numeric' })}</p></div><PriorityBadge priority={recommendationItem.priority} /></div><div className="reason-line"><span className="reason-dot" />{firstRecommendation.reason}</div><div className="focus-actions"><button className="button button-dark" onClick={() => document.getElementById(`assignment-${firstId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>Go to assignment <ArrowRight size={16} /></button><button className="subtle-action" onClick={() => toggleComplete(recommendationItem)}><Check size={16} /> Mark complete</button></div></> : <div className="focus-empty"><h2>{dashboard.counts.total ? 'Everything on your list is complete.' : 'Start with one assignment.'}</h2><p>{dashboard.counts.total ? 'Take a breather — you’ve earned it.' : 'Add a deadline and DeadlinePilot will help you pick up momentum.'}</p>{!dashboard.counts.total && <button className="text-action" onClick={() => setModal({ mode: 'create' })}>Add your first one <ArrowRight size={15} /></button>}</div>}
              <div className="focus-orb orb-one" /><div className="focus-orb orb-two" />
            </div>
            <div className="progress-card"><div className="card-heading"><div><span className="eyebrow">YOUR MOMENTUM</span><h3>Progress so far</h3></div><span className="progress-icon"><TrendingUp size={17} /></span></div><div className="progress-number">{dashboard.completionRate}<span>%</span></div><div className="progress-track"><span style={{ width: `${dashboard.completionRate}%` }} /></div><div className="progress-foot"><span>{dashboard.counts.completed} done</span><span>{dashboard.counts.pending} to go</span></div><div className="progress-divider" /><div className="upcoming-heading"><span className="eyebrow">COMING UP</span><span>{dashboard.upcoming?.length || 0} next</span></div>{dashboard.upcoming?.length ? <div className="upcoming-list">{dashboard.upcoming.slice(0, 3).map((item) => <div className="upcoming-item" key={item._id}><span className="upcoming-date">{formatDue(item.dueAt, { month: 'short', day: 'numeric' })}</span><span className="upcoming-name">{item.title}</span><span className={`priority-dot ${item.priority}`} /></div>)}</div> : <div className="upcoming-empty">No upcoming deadlines yet.</div>}</div>
          </section>

          <section className="assignments-section" id="assignments">
            <div className="section-heading"><div><span className="eyebrow">KEEP YOUR EYE ON IT</span><h2>Your assignments <span className="heading-count">{dashboard.counts.total}</span></h2></div><button className="button button-outline" onClick={() => setModal({ mode: 'create' })}><Plus size={16} /> Add new</button></div>
            <div className="toolbar"><label className="search-box"><Search size={17} /><input aria-label="Search by title or course" placeholder="Search assignments or courses…" value={query} onChange={(e) => setQuery(e.target.value)} /><kbd>⌕</kbd></label><div className="filter-controls"><span className="filter-label"><SlidersHorizontal size={15} /> Filter</span><select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)}><option value="all">All status</option><option value="pending">In progress</option><option value="completed">Completed</option></select><select aria-label="Filter by priority" value={priority} onChange={(e) => setPriority(e.target.value)}><option value="all">All priority</option><option value="high">High priority</option><option value="medium">Medium priority</option><option value="low">Low priority</option></select><select aria-label="Sort assignments" value={sort} onChange={(e) => setSort(e.target.value)}><option value="due">Due date</option><option value="urgency">Urgency</option></select><ArrowDownWideNarrow size={15} className="sort-icon" /></div></div>
            <div className="assignment-list">
              {loading ? <div className="list-loading"><span className="spinner" />Loading assignments…</div> : assignments.length ? assignments.map((item) => <AssignmentRow key={item._id} item={item} recommendation={item._id === firstId} onToggle={() => toggleComplete(item)} onEdit={() => setModal({ mode: 'edit', assignment: item })} onDelete={() => remove(item)} />) : <div className="empty-state"><span className="empty-icon"><BookOpen size={20} /></span><h3>{query || status !== 'all' || priority !== 'all' ? 'No matches found.' : 'Nothing on the list yet.'}</h3><p>{query || status !== 'all' || priority !== 'all' ? 'Try a different search or clear one of the filters.' : 'Add your first assignment and we’ll help you find a steady rhythm.'}</p>{query || status !== 'all' || priority !== 'all' ? <button className="text-action" onClick={() => { setQuery(''); setStatus('all'); setPriority('all') }}>Clear filters</button> : <button className="button button-dark" onClick={() => setModal({ mode: 'create' })}><Plus size={16} /> Add assignment</button>}</div>}
            </div>
          </section>
          <footer className="page-footer"><span>DeadlinePilot</span><span>Small steps. Clear deadlines. Better weeks.</span></footer>
        </div>
      </main>
      {modal && <AssignmentModal assignment={modal.assignment} onClose={() => setModal(null)} onSaved={async () => { await refresh(); setToast(modal.mode === 'edit' ? 'Assignment updated' : 'Assignment added') }} />}
      {toast && <div className="toast" role="status"><CheckCircle2 size={17} />{toast}</div>}
    </div>
  )
}

function StatCard({ icon, label, value, detail, tone }) {
  return <article className="stat-card"><div className={`stat-icon ${tone}`}>{icon}</div><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className="stat-detail">{detail}</div></article>
}

function PriorityBadge({ priority }) { return <span className={`priority-badge ${priority}`}><span />{priority} priority</span> }

function AssignmentRow({ item, recommendation, onToggle, onEdit, onDelete }) {
  const overdue = item.status !== 'completed' && new Date(item.dueAt).getTime() < Date.now()
  return <article className={`assignment-row ${item.status === 'completed' ? 'is-complete' : ''} ${recommendation ? 'is-recommended' : ''}`} id={`assignment-${item._id}`}>
    <button className={`check-button ${item.status === 'completed' ? 'checked' : ''}`} onClick={onToggle} aria-label={item.status === 'completed' ? `Reopen ${item.title}` : `Mark ${item.title} complete`}>{item.status === 'completed' ? <Check size={15} /> : <span />}</button>
    <div className="assignment-main"><div className="assignment-title-line"><h3>{item.title}</h3>{recommendation && <span className="recommended-label"><Sparkles size={12} /> next up</span>}</div><div className="assignment-meta"><span><BookOpen size={13} />{item.course}</span><span><CalendarDays size={13} className={overdue ? 'overdue-icon' : ''} />{overdue ? `Overdue · ${formatDue(item.dueAt, { month: 'short', day: 'numeric' })}` : formatDue(item.dueAt, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>{item.estimatedHours > 0 && <span><Clock3 size={13} />{item.estimatedHours}h</span>}</div>{item.description && <p className="assignment-description">{item.description}</p>}</div>
    <div className="assignment-status"><PriorityBadge priority={item.priority} /><span className={`status-pill ${item.status}`}>{item.status === 'completed' ? 'Completed' : 'In progress'}</span></div>
    <div className="row-actions"><button className="icon-button" aria-label={`Edit ${item.title}`} onClick={onEdit}><Pencil size={16} /></button><button className="icon-button delete-action" aria-label={`Delete ${item.title}`} onClick={onDelete}><Trash2 size={16} /></button></div>
  </article>
}
