import { Link } from 'react-router-dom'

const metrics = [
  { label: 'Total employees', value: '248', change: '+8 this month', tone: 'blue', icon: '◎' },
  { label: 'Present today', value: '219', change: '88% attendance', tone: 'green', icon: '✓' },
  { label: 'Pending leave', value: '12', change: 'Needs review', tone: 'amber', icon: '◷' },
  { label: 'Open positions', value: '08', change: 'Across 4 teams', tone: 'violet', icon: '＋' },
]

const departments = [
  ['Engineering', 82, '82'], ['Sales', 61, '61'], ['Operations', 48, '48'], ['People', 28, '28'],
]

export default function Dashboard() {
  return <>
    <div className="welcome-row"><div><p className="eyebrow">PEOPLE OPERATIONS</p><h1>Welcome to your workspace <span>✦</span></h1><p className="muted">Here’s a sample snapshot of people operations. Live totals can be connected as modules are integrated.</p></div><Link className="primary-button" to="/employees">＋ Add employee</Link></div>
    <section className="metric-grid" aria-label="HR summary">
      {metrics.map((item) => <article className="metric-card" key={item.label}><div className={`metric-icon ${item.tone}`}>{item.icon}</div><p>{item.label}</p><div className="metric-value">{item.value}</div><span className="metric-note">{item.change}</span></article>)}
    </section>
    <section className="dashboard-grid">
      <article className="panel department-panel"><div className="panel-heading"><div><h2>People by department</h2><p>Team distribution across the organisation</p></div><button className="text-button">View report ↗</button></div><div className="department-list">{departments.map(([name, width, count]) => <div className="department-row" key={name}><div className="department-label"><span>{name}</span><strong>{count}</strong></div><div className="progress-track"><span style={{ width: `${width}%` }} /></div></div>)}</div><div className="panel-footnote">217 active employees <span>·</span> 4 departments</div></article>
      <article className="panel attention-panel"><div className="panel-heading"><div><h2>Needs your attention</h2><p>Items that may need a follow-up</p></div><span className="alert-count">3</span></div><div className="attention-item"><span className="attention-icon amber">◷</span><div><strong>Leave requests</strong><p>12 requests are waiting for review</p></div><span className="chevron">›</span></div><div className="attention-item"><span className="attention-icon blue">◎</span><div><strong>Onboarding tasks</strong><p>4 new starters have tasks in progress</p></div><span className="chevron">›</span></div><div className="attention-item"><span className="attention-icon rose">↗</span><div><strong>Workload indicator</strong><p>One team may benefit from a check-in</p></div><span className="chevron">›</span></div></article>
    </section>
    <section className="dashboard-grid lower-grid">
      <article className="panel performance-panel"><div className="panel-heading"><div><h2>Performance overview</h2><p>Sample review snapshot</p></div><Link className="text-button" to="/performance">View goals ↗</Link></div><div className="performance-summary"><strong>4.2<span>/5</span></strong><div><span className="performance-stars">★★★★★</span><p>Average review rating</p></div></div><div className="department-row"><div className="department-label"><span>Goal progress</span><strong>76%</strong></div><div className="progress-track"><span className="goal-progress" style={{ width: '76%' }} /></div></div><p className="panel-footnote">Demonstration values until Person 3’s review data is integrated.</p></article>
      <article className="panel feedback-panel"><div className="panel-heading"><div><h2>Recent feedback</h2><p>Anonymous sample comments</p></div><Link className="text-button" to="/feedback">Open feedback ↗</Link></div><div className="feedback-quote"><span className="feedback-bullet">“</span><div><p>Team communication has improved this quarter.</p><span>Engineering · Recent survey</span></div></div><div className="feedback-quote"><span className="feedback-bullet green">“</span><div><p>I’d appreciate more focus time during busy weeks.</p><span>Operations · Recent survey</span></div></div></article>
    </section>
    <section className="panel quick-panel"><div className="panel-heading"><div><h2>Quick access</h2><p>Jump to a people operations area</p></div></div><div className="quick-links">{[['Employees','/employees'],['Recruitment','/recruitment'],['Attendance','/attendance'],['Performance','/performance'],['Analytics','/analytics'],['Simulator','/simulator']].map(([label, path]) => <Link to={path} key={path}><span className="quick-link-icon">↗</span>{label}<span className="chevron">›</span></Link>)}</div></section>
  </>
}

