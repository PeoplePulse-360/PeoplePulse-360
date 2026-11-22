import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { isSupabaseConfigured, supabase } from '../lib/supabase.js'

const today = new Date().toISOString().slice(0, 10)

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
    { label: 'Total employees', value: summary.employees, change: summary.employees === null ? 'Data access unavailable' : 'Live from Supabase', tone: 'blue', icon: '◎' },
    { label: 'Present today', value: summary.present, change: summary.present === null ? 'Attendance data unavailable' : 'Live attendance records', tone: 'green', icon: '✓' },
    { label: 'Pending leave', value: summary.pendingLeave, change: summary.pendingLeave === null ? 'Leave data unavailable' : 'Requests awaiting review', tone: 'amber', icon: '◷' },
    { label: 'Open positions', value: summary.openJobs, change: summary.openJobs === null ? 'Recruitment data unavailable' : 'Live from Supabase', tone: 'violet', icon: '＋' },
  ]
  const departments = summary.departments

  return <>
    <div className="welcome-row"><div><p className="eyebrow">PEOPLE OPERATIONS</p><h1>Welcome to your workspace <span>✦</span></h1><p className="muted">{isSupabaseConfigured ? 'Live totals appear when the signed-in account has permission to read each HR module.' : 'Connect Supabase to load live HR totals.'}</p></div><Link className="primary-button" to="/employees">＋ Add employee</Link></div>
    <section className="metric-grid" aria-label="HR summary">
      {metrics.map((item) => <article className="metric-card" key={item.label}><div className={`metric-icon ${item.tone}`}>{item.icon}</div><p>{item.label}</p><div className="metric-value">{summary.loading ? '…' : item.value ?? '—'}</div><span className="metric-note">{item.change}</span></article>)}
    </section>
    <section className="dashboard-grid">
      <article className="panel department-panel"><div className="panel-heading"><div><h2>People by department</h2><p>Team distribution across the organisation</p></div><Link className="text-button" to="/analytics">View report ↗</Link></div><div className="department-list">{departments.length ? departments.map(([name, width, count]) => <div className="department-row" key={name}><div className="department-label"><span>{name}</span><strong>{count}</strong></div><div className="progress-track"><span style={{ width: `${width}%` }} /></div></div>) : <p className="panel-footnote">{summary.loading ? 'Loading department totals…' : summary.employees === null ? 'Employee data is not available to this account.' : 'No employee department records yet.'}</p>}</div><div className="panel-footnote">{summary.employees === null ? 'Live department totals unavailable' : `${summary.employees} employee records · ${departments.length} departments`}</div></article>
      <article className="panel attention-panel"><div className="panel-heading"><div><h2>Needs your attention</h2><p>Items that may need a follow-up</p></div><span className="alert-count">{summary.pendingLeave ?? '—'}</span></div><div className="attention-item"><span className="attention-icon amber">◷</span><div><strong>Leave requests</strong><p>{summary.pendingLeave === null ? 'Live leave data is not available to this account' : `${summary.pendingLeave} requests are waiting for review`}</p></div><span className="chevron">›</span></div><div className="attention-item"><span className="attention-icon blue">◎</span><div><strong>Onboarding tasks</strong><p>Onboarding records will appear when that module has data and access</p></div><span className="chevron">›</span></div><div className="attention-item"><span className="attention-icon rose">↗</span><div><strong>Workload indicator</strong><p>Run the sample analysis on the Workforce Insights page</p></div><span className="chevron">›</span></div></article>
    </section>
    <section className="dashboard-grid lower-grid">
      <article className="panel performance-panel"><div className="panel-heading"><div><h2>Performance overview</h2><p>Sample review snapshot</p></div><Link className="text-button" to="/performance">View goals ↗</Link></div><div className="performance-summary"><strong>4.2<span>/5</span></strong><div><span className="performance-stars">★★★★★</span><p>Average review rating</p></div></div><div className="department-row"><div className="department-label"><span>Goal progress</span><strong>76%</strong></div><div className="progress-track"><span className="goal-progress" style={{ width: '76%' }} /></div></div><p className="panel-footnote">Demonstration values until Person 3’s review data is integrated.</p></article>
      <article className="panel feedback-panel"><div className="panel-heading"><div><h2>Recent feedback</h2><p>Anonymous sample comments</p></div><Link className="text-button" to="/feedback">Open feedback ↗</Link></div><div className="feedback-quote"><span className="feedback-bullet">“</span><div><p>Team communication has improved this quarter.</p><span>Engineering · Recent survey</span></div></div><div className="feedback-quote"><span className="feedback-bullet green">“</span><div><p>I’d appreciate more focus time during busy weeks.</p><span>Operations · Recent survey</span></div></div></article>
    </section>
    <section className="panel quick-panel"><div className="panel-heading"><div><h2>Quick access</h2><p>Jump to a people operations area</p></div></div><div className="quick-links">{[['Employees','/employees'],['Recruitment','/recruitment'],['Attendance','/attendance'],['Performance','/performance'],['Analytics','/analytics'],['Simulator','/simulator']].map(([label, path]) => <Link to={path} key={path}><span className="quick-link-icon">↗</span>{label}<span className="chevron">›</span></Link>)}</div></section>
  </>
}
