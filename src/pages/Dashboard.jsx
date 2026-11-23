import { useEffect, useState } from 'react'
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BriefcaseBusiness,
  CalendarCheck,
  ClipboardCheck,
  Download,
  MessageSquareText,
  Plane,
  Sparkles,
  Star,
  UsersRound,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider.jsx'
import { axisTick, distributionColors, gridStroke, series } from '../components/charts/chartTheme.js'
import { dashboardSummary as demoSummary, departments as demoDepartments } from '../data/analytics.js'
import { isSupabaseConfigured, supabase } from '../lib/supabase.js'
import { getUserDisplayName } from '../utils/userDisplay.js'

const localToday = new Date()
localToday.setMinutes(localToday.getMinutes() - localToday.getTimezoneOffset())
const today = localToday.toISOString().slice(0, 10)

const sampleActivities = [
  { title: 'New employee onboarding', detail: 'Example activity', time: 'Today', Icon: UsersRound },
  { title: 'Leave request reviewed', detail: 'Example activity', time: 'Today', Icon: CalendarCheck },
  { title: 'Performance review completed', detail: 'Example activity', time: 'This week', Icon: BarChart3 },
]

export default function Dashboard() {
  const { user } = useAuth()
  const currentHour = new Date().getHours()
  const greeting = currentHour < 12 ? 'Good Morning' : currentHour < 17 ? 'Good Afternoon' : 'Good Evening'
  const [reportPeriod, setReportPeriod] = useState('Last 30 days')
  const [summary, setSummary] = useState({
    employees: null,
    employeeName: null,
    attendanceRate: null,
    pendingLeave: null,
    openJobs: null,
    departments: [],
    loading: true,
  })
  const greetingName = getUserDisplayName(user, summary.employeeName).split(/\s+/)[0]

  useEffect(() => {
    let active = true
    async function loadSummary() {
      if (!isSupabaseConfigured) {
        setSummary((current) => ({ ...current, loading: false }))
        return
      }

      const [employeesResult, attendanceResult, leaveResult, jobsResult] = await Promise.all([
        supabase.from('employees').select('id,department,status,full_name,email'),
        supabase.from('attendance').select('status').eq('attendance_date', today),
        supabase.from('leaves').select('id', { count: 'exact', head: true }).eq('status', 'Pending'),
        supabase.from('jobs').select('id', { count: 'exact', head: true }).eq('status', 'Open'),
      ])

      if (!active) return
      const employeeRows = employeesResult.error ? null : (employeesResult.data ?? [])
      const attendanceRows = attendanceResult.error ? null : (attendanceResult.data ?? [])
      const employeeName = employeeRows?.find((employee) => employee.email?.toLowerCase() === user?.email?.toLowerCase())?.full_name ?? null
      const departmentCounts = new Map()
      employeeRows?.forEach((employee) => {
        const department = employee.department || 'Unassigned'
        departmentCounts.set(department, (departmentCounts.get(department) ?? 0) + 1)
      })

      setSummary({
        employees: employeeRows?.length ?? null,
        employeeName,
        attendanceRate: attendanceRows?.length
          ? Math.round(attendanceRows.filter((record) => record.status?.toLowerCase() === 'present').length / attendanceRows.length * 100)
          : null,
        pendingLeave: leaveResult.error ? null : (leaveResult.count ?? 0),
        openJobs: jobsResult.error ? null : (jobsResult.count ?? 0),
        departments: [...departmentCounts.entries()]
          .map(([department, count]) => ({ department, count }))
          .sort((a, b) => b.count - a.count),
        loading: false,
      })
    }

    loadSummary()
    return () => { active = false }
  }, [user?.email])

  function exportReport() {
    const rows = [
      ['PeoplePulse360 HR Dashboard Report'],
      ['Selected report period', reportPeriod],
      ['Generated', new Date().toLocaleString()],
      ['Note', 'Live summary counts are shown where available. Performance distribution is demonstration data until performance reviews are connected.'],
      [],
      ['Metric', 'Value'],
      ['Total employees', summary.employees ?? 'Unavailable'],
      ['Attendance rate today', summary.attendanceRate === null ? 'Unavailable' : `${summary.attendanceRate}%`],
      ['Average performance (sample)', `${demoSummary.averagePerformance.toFixed(1)} / 5`],
      ['Open leave requests', summary.pendingLeave ?? 'Unavailable'],
      ['Open positions', summary.openJobs ?? 'Unavailable'],
      [],
      ['Department', 'Employee count'],
      ...summary.departments.map(({ department, count }) => [department, count]),
    ]
    const csv = rows.map((row) => row.map((value) => '"' + String(value ?? '').replaceAll('"', '""') + '"').join(',')).join('\r\n')
    const file = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(file)
    const link = document.createElement('a')
    link.href = url
    link.download = 'peoplepulse360-report-' + new Date().toISOString().slice(0, 10) + '.csv'
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  const metrics = [
    { label: 'Total employees', value: summary.employees, note: 'Across the organisation', Icon: UsersRound, tone: 'lavender' },
    { label: 'Attendance rate', value: summary.attendanceRate === null ? null : `${summary.attendanceRate}%`, note: summary.attendanceRate === null ? 'No attendance records today' : 'Based on today’s records', Icon: CalendarCheck, tone: 'mint' },
    { label: 'Avg performance', value: `${demoSummary.averagePerformance.toFixed(1)}/5`, note: 'Demonstration data · reviews not connected', Icon: Star, tone: 'blue' },
    { label: 'Open requests', value: summary.pendingLeave, note: 'Leave requests awaiting review', Icon: Activity, tone: 'lavender' },
  ]
  const departmentChartData = summary.departments
  const performanceDepartments = demoDepartments
    .filter((department) => ['Engineering', 'Design', 'Marketing', 'Human Resources'].includes(department.name))
    .map((department) => ({ name: department.name === 'Human Resources' ? 'HR' : department.name, value: department.rating }))
  const performanceAverage = demoSummary.averagePerformance.toFixed(1)

  return <div className="dashboard-page">
    <div className="welcome-row">
      <div>
        <p className="eyebrow">HR WORKSPACE</p>
        <h1>{greeting}, {greetingName}! <span className="welcome-sparkle">✦</span></h1>
        <p className="muted">Here’s what’s happening at PeoplePulse 360 today.</p>
      </div>
      <div className="welcome-actions report-controls">
        <label className="visually-hidden" htmlFor="dashboard-report-period">Report date range</label>
        <select id="dashboard-report-period" className="period-select" value={reportPeriod} onChange={(event) => setReportPeriod(event.target.value)}>
          <option>Last 7 days</option>
          <option>Last 30 days</option>
          <option>Last 90 days</option>
          <option>This year</option>
        </select>
        <button className="export-button" type="button" onClick={exportReport} disabled={summary.loading}>
          <Download size={15} strokeWidth={1.9} /> Export Report
        </button>
      </div>
    </div>

    <section className="metric-grid" aria-label="HR summary">
      {metrics.map(({ label, value, note, Icon, tone }) => <article className="metric-card" key={label}>
        <div className={`metric-icon ${tone}`}><Icon size={20} strokeWidth={1.8} /></div>
        <div className="metric-content">
          <p>{label}</p>
          <div className="metric-value">{summary.loading ? '…' : value ?? '—'}</div>
          <span className="metric-note">{note}</span>
        </div>
      </article>)}
    </section>

    <section className="dashboard-grid dashboard-primary-grid">
      <article className="panel department-panel">
        <div className="panel-heading">
          <div className="section-title"><span className="section-icon"><BarChart3 size={18} /></span><div><h2>Department overview</h2><p>Current employee distribution</p></div></div>
          <Link className="text-button" to="/analytics">View analytics <ArrowUpRight size={14} /></Link>
        </div>
        {departmentChartData.length ? <div className="dashboard-chart department-chart">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={departmentChartData} margin={{ top: 12, right: 12, left: -18, bottom: 0 }}>
              <defs><linearGradient id="departmentFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={series.blue} stopOpacity={0.28} /><stop offset="100%" stopColor={series.blue} stopOpacity={0.02} /></linearGradient></defs>
              <CartesianGrid stroke={gridStroke} vertical={false} />
              <XAxis dataKey="department" tick={axisTick} axisLine={false} tickLine={false} tickMargin={9} />
              <YAxis allowDecimals={false} tick={axisTick} axisLine={false} tickLine={false} width={35} />
              <Tooltip contentStyle={{ border: '1px solid var(--border)', borderRadius: 12, boxShadow: '0 4px 16px rgba(40,45,65,.08)' }} />
              <Area type="monotone" dataKey="count" name="Employees" stroke={series.indigo} strokeWidth={2.5} fill="url(#departmentFill)" activeDot={{ r: 5, fill: series.indigo, stroke: '#fff', strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div> : <div className="dashboard-chart-empty">{summary.loading ? 'Loading department data…' : 'Department data is not available to this account yet.'}</div>}
        <div className="panel-footnote"><span className="footnote-dot" />{summary.employees === null ? 'Live department totals unavailable' : `${summary.employees} employee records · ${departmentChartData.length} departments`}</div>
      </article>

      <article className="panel insights-panel">
        <div className="panel-heading">
          <div className="section-title"><span className="section-icon violet"><Sparkles size={18} /></span><div><h2>AI insights</h2><p>Explainable workforce signals</p></div></div>
          <Link className="text-button" to="/ai/journey">View details <ArrowUpRight size={14} /></Link>
        </div>
        <div className="insight-feature">
          <span className="insight-bulb"><Sparkles size={19} /></span>
          <div><strong>Explore employee and workload signals</strong><p>Run an analysis to review indicators and suggested HR actions. Results are guidance for review, not predictions of employee behaviour.</p></div>
          <ArrowUpRight className="insight-trend" size={19} />
        </div>
        <div className="insight-tags">
          <Link to="/ai/journey"><UsersRound size={14} /> Journey review</Link>
          <Link to="/ai/workload"><Activity size={14} /> Workload check</Link>
          <Link to="/simulator"><Sparkles size={14} /> What-if plan</Link>
        </div>
      </article>
    </section>

    <section className="dashboard-lower-grid">
      <article className="panel lower-panel performance-panel">
        <div className="panel-heading">
          <div className="section-title"><span className="section-icon violet"><Star size={18} /></span><div><h2>Performance distribution</h2><p>Sample department ratings</p></div></div>
          <Link className="icon-link" to="/performance" aria-label="Open performance"><ArrowUpRight size={16} /></Link>
        </div>
        <div className="performance-chart-row">
          <div className="performance-donut">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart><Pie data={performanceDepartments} dataKey="value" nameKey="name" innerRadius="63%" outerRadius="88%" paddingAngle={2} stroke="white" strokeWidth={2}>
                {performanceDepartments.map((item, index) => <Cell key={item.name} fill={distributionColors[index % distributionColors.length]} />)}
              </Pie></PieChart>
            </ResponsiveContainer>
            <div className="donut-center"><strong>{performanceAverage}/5</strong><span>Overall</span></div>
          </div>
          <ul className="performance-legend">
            {performanceDepartments.map((department, index) => <li key={department.name}><span style={{ background: distributionColors[index % distributionColors.length] }} /><span>{department.name}</span><strong>{Math.round(department.value * 20)}%</strong></li>)}
          </ul>
        </div>
        <p className="chart-disclaimer">Demonstration ratings until live performance reviews are connected.</p>
      </article>

      <article className="panel lower-panel activity-panel">
        <div className="panel-heading">
          <div className="section-title"><span className="section-icon mint"><ClipboardCheck size={18} /></span><div><h2>Recent activities</h2><p>Example activity timeline</p></div></div>
          <Link className="text-button" to="/analytics">View all <ArrowRight size={14} /></Link>
        </div>
        <ol className="activity-timeline">
          {sampleActivities.map(({ title, detail, time, Icon }) => <li key={title}>
            <span className="activity-icon"><Icon size={15} /></span>
            <div><strong>{title}</strong><span>{detail}</span></div>
            <time>{time}</time>
          </li>)}
        </ol>
      </article>

      <article className="panel lower-panel quick-panel">
        <div className="panel-heading"><div className="section-title"><span className="section-icon blue"><Sparkles size={18} /></span><div><h2>Quick actions</h2><p>Go straight to a task</p></div></div></div>
        <div className="quick-links">
          <Link to="/employees"><span className="quick-action-icon lavender"><UsersRound size={17} /></span><span>Add employee</span><ArrowUpRight className="quick-action-arrow" size={14} /></Link>
          <button type="button" onClick={exportReport}><span className="quick-action-icon blue"><BarChart3 size={17} /></span><span>Create report</span><ArrowUpRight className="quick-action-arrow" size={14} /></button>
          <Link to="/leave"><span className="quick-action-icon mint"><Plane size={17} /></span><span>Manage leave</span><ArrowUpRight className="quick-action-arrow" size={14} /></Link>
          <Link to="/analytics"><span className="quick-action-icon butter"><Activity size={17} /></span><span>View analytics</span><ArrowUpRight className="quick-action-arrow" size={14} /></Link>
        </div>
      </article>
    </section>
  </div>
}
