import { useEffect, useState } from 'react'
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BriefcaseBusiness,
  CalendarCheck,
  CircleHelp,
  ClipboardCheck,
  MessageSquareText,
  Network,
  Plane,
  Sparkles,
  Star,
  UsersRound,
  Workflow,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { isSupabaseConfigured, supabase } from '../lib/supabase.js'

const localToday = new Date()
localToday.setMinutes(localToday.getMinutes() - localToday.getTimezoneOffset())
const today = localToday.toISOString().slice(0, 10)

export default function Dashboard() {
  const [summary, setSummary] = useState({ employees: null, present: null, pendingLeave: null, openJobs: null, departments: [], loading: true })

  useEffect(() => {
    let active = true
    async function loadSummary() {
      if (!isSupabaseConfigured) {
        setSummary((current) => ({ ...current, loading: false }))
        return
      }

      const [employeesResult, presentResult, leaveResult, jobsResult] = await Promise.all([
        supabase.from('employees').select('department,status'),
        supabase.from('attendance').select('id', { count: 'exact', head: true }).eq('attendance_date', today).eq('status', 'Present'),
        supabase.from('leaves').select('id', { count: 'exact', head: true }).eq('status', 'Pending'),
        supabase.from('jobs').select('id', { count: 'exact', head: true }).eq('status', 'Open'),
      ])

      if (!active) return
      const employeeRows = employeesResult.error ? null : (employeesResult.data ?? [])
      const counts = new Map()
      employeeRows?.forEach((employee) => {
        const name = employee.department || 'Unassigned'
        counts.set(name, (counts.get(name) ?? 0) + 1)
      })
      const departmentRows = [...counts.entries()].sort((a, b) => b[1] - a[1])
      const largest = Math.max(1, ...departmentRows.map(([, count]) => count))
      setSummary({
        employees: employeeRows?.length ?? null,
        present: presentResult.error ? null : (presentResult.count ?? 0),
        pendingLeave: leaveResult.error ? null : (leaveResult.count ?? 0),
        openJobs: jobsResult.error ? null : (jobsResult.count ?? 0),
        departments: departmentRows.map(([name, count]) => [name, Math.round(count / largest * 100), count]),
        loading: false,
      })
    }
    loadSummary()
    return () => { active = false }
  }, [])

  const metrics = [
    { label: 'Total employees', value: summary.employees, helper: summary.employees === null ? 'Employee data unavailable' : 'Across the organisation', Icon: UsersRound, tone: 'lavender' },
    { label: 'Present today', value: summary.present, helper: summary.present === null ? 'Attendance data unavailable' : 'Attendance records today', Icon: CalendarCheck, tone: 'mint' },
    { label: 'Pending leave', value: summary.pendingLeave, helper: summary.pendingLeave === null ? 'Leave data unavailable' : 'Requests waiting for review', Icon: Plane, tone: 'butter' },
    { label: 'Open positions', value: summary.openJobs, helper: summary.openJobs === null ? 'Recruitment data unavailable' : 'Currently recruiting', Icon: BriefcaseBusiness, tone: 'rose' },
  ]

  const insightSteps = [
    { title: 'Employee signals', path: '/ai/journey', Icon: UsersRound },
    { title: 'Workload check', path: '/ai/workload', Icon: Network },
    { title: 'What-if plan', path: '/simulator', Icon: Workflow },
  ]

  const quickActions = [
    { title: 'Add employee', path: '/employees', Icon: UsersRound, tone: 'lavender' },
    { title: 'Create job opening', path: '/recruitment', Icon: BriefcaseBusiness, tone: 'mint' },
    { title: 'Manage leave', path: '/leave', Icon: Plane, tone: 'butter' },
    { title: 'View analytics', path: '/analytics', Icon: BarChart3, tone: 'rose' },
  ]

  return <div className="dashboard-page">
    <div className="welcome-row">
      <div>
        <p className="eyebrow">PEOPLE OPERATIONS</p>
        <h1>Good morning, HR team <span className="welcome-sparkle">✦</span></h1>
        <p className="muted">Here’s what’s happening at PeoplePulse 360 today.</p>
      </div>
      <div className="welcome-actions">
        <span className="live-chip"><span className="status-dot" />{isSupabaseConfigured ? 'Live workspace' : 'Demo workspace'}</span>
        <Link className="primary-button" to="/employees"><UsersRound size={15} /> Add employee</Link>
      </div>
    </div>

    <section className="metric-grid" aria-label="HR summary">
      {metrics.map(({ label, value, helper, Icon, tone }) => <article className="metric-card" key={label}>
        <div className={`metric-icon ${tone}`}><Icon size={20} strokeWidth={1.8} /></div>
        <div className="metric-content">
          <p>{label}</p>
          <div className="metric-value">{summary.loading ? '…' : value ?? '—'}</div>
          <span className="metric-note">{helper}</span>
        </div>
        <span className="metric-corner" aria-hidden="true"><ArrowUpRight size={15} /></span>
      </article>)}
    </section>

    <section className="dashboard-grid dashboard-primary-grid">
      <article className="panel department-panel">
        <div className="panel-heading">
          <div className="section-title"><span className="section-icon"><BarChart3 size={18} /></span><div><h2>Department overview</h2><p>Employee distribution by department</p></div></div>
          <Link className="text-button" to="/analytics">View analytics <ArrowUpRight size={14} /></Link>
        </div>
        <div className="department-list">
          {summary.departments.length ? summary.departments.map(([name, width, count], index) => <div className="department-row" key={name}>
            <div className="department-label"><span>{name}</span><strong>{count}</strong></div>
            <div className="progress-track"><span className={`dept-bar dept-bar-${index % 4}`} style={{ width: `${width}%` }} /></div>
          </div>) : <div className="empty-insight"><UsersRound size={22} /><span>{summary.loading ? 'Loading departments…' : summary.employees === null ? 'Employee data is not available to this account.' : 'No department records yet.'}</span></div>}
        </div>
        <div className="panel-footnote"><span className="footnote-dot" />{summary.employees === null ? 'Live department totals unavailable' : `${summary.employees} employee records · ${summary.departments.length} departments`}</div>
      </article>

      <article className="panel insights-panel">
        <div className="panel-heading">
          <div className="section-title"><span className="section-icon violet"><Sparkles size={18} /></span><div><h2>AI insights</h2><p>Explore explainable workforce signals</p></div></div>
          <Link className="text-button" to="/ai/journey">View details <ArrowUpRight size={14} /></Link>
        </div>
        <div className="workflow-visual" aria-label="People data to HR action workflow">
          {insightSteps.map(({ title, path, Icon }, index) => <div className="workflow-step-wrap" key={path}>
            <Link className="workflow-step" to={path}><span className={`workflow-node node-${index}`}><Icon size={19} strokeWidth={1.8} /></span><span>{title}</span></Link>
            {index < insightSteps.length - 1 && <span className="workflow-connector"><ArrowRight size={17} /></span>}
          </div>)}
        </div>
        <div className="insight-callout"><span className="insight-bulb"><Sparkles size={17} /></span><div><strong>Turn workforce data into next steps</strong><p>Run an analysis to review indicators and possible actions. Current examples use synthetic data.</p></div></div>
        <div className="insight-tags"><Link to="/ai/journey">Journey review <ArrowRight size={13} /></Link><Link to="/ai/workload">Workload signals <ArrowRight size={13} /></Link></div>
      </article>
    </section>

    <section className="dashboard-lower-grid">
      <article className="panel lower-panel performance-panel">
        <div className="panel-heading">
          <div className="section-title"><span className="section-icon butter"><Star size={18} /></span><div><h2>Performance overview</h2><p>Reviews and goal progress</p></div></div>
          <Link className="icon-link" to="/performance" aria-label="Open performance"><ArrowUpRight size={16} /></Link>
        </div>
        <div className="module-empty"><span className="module-empty-icon"><BarChart3 size={21} /></span><strong>Review data is not connected yet</strong><p>Performance charts will appear here when Person 3’s module is integrated.</p><Link className="subtle-link" to="/performance">Open performance <ArrowRight size={14} /></Link></div>
      </article>

      <article className="panel lower-panel feedback-panel">
        <div className="panel-heading">
          <div className="section-title"><span className="section-icon mint"><MessageSquareText size={18} /></span><div><h2>Recent feedback</h2><p>Survey responses and themes</p></div></div>
          <Link className="icon-link" to="/feedback" aria-label="Open feedback"><ArrowUpRight size={16} /></Link>
        </div>
        <div className="module-empty"><span className="module-empty-icon"><CircleHelp size={21} /></span><strong>Feedback data is not connected yet</strong><p>Recent survey themes will show here after the feedback module is integrated.</p><Link className="subtle-link" to="/feedback">Open feedback <ArrowRight size={14} /></Link></div>
      </article>

      <article className="panel lower-panel quick-panel">
        <div className="panel-heading"><div className="section-title"><span className="section-icon rose"><Sparkles size={18} /></span><div><h2>Quick actions</h2><p>Go straight to a task</p></div></div></div>
        <div className="quick-links">
          {quickActions.map(({ title, path, Icon, tone }) => <Link to={path} key={title}><span className={`quick-action-icon ${tone}`}><Icon size={17} /></span><span>{title}</span><ArrowUpRight className="quick-action-arrow" size={14} /></Link>)}
        </div>
      </article>
    </section>
  </div>
}

