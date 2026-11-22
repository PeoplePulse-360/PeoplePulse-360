import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider.jsx'

const groups = [
  { title: 'WORKSPACE', links: [['/', 'Overview'], ['/employees', 'Employees'], ['/recruitment', 'Recruitment']] },
  { title: 'PEOPLE', links: [['/attendance', 'Attendance'], ['/leave', 'Leave'], ['/onboarding', 'Onboarding'], ['/performance', 'Performance'], ['/feedback', 'Feedback'], ['/grievances', 'Grievances'], ['/exits', 'Exit management']] },
  { title: 'INSIGHTS', links: [['/analytics', 'HR analytics'], ['/ai/journey', 'Journey insights'], ['/ai/workload', 'Workload insights'], ['/simulator', 'What-if simulator']] },
]

export default function AppLayout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">P</span><span>peoplepulse<span className="brand-light">360</span></span></div>
        <div className="workspace-label">PEOPLE OPERATIONS</div>
        <nav aria-label="Main navigation">
          {groups.map((group) => <section className="nav-group" key={group.title}>
            <p className="nav-heading">{group.title}</p>
            {group.links.map(([to, label]) => <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              <span className="nav-dot" aria-hidden="true" />{label}
            </NavLink>)}
          </section>)}
        </nav>
        <div className="sidebar-footer"><div className="avatar">{(user?.email?.[0] ?? 'H').toUpperCase()}</div><div className="profile-copy"><strong>{user?.email ?? 'HR workspace'}</strong><span>People team</span></div><button className="icon-button" onClick={handleSignOut} title="Sign out" aria-label="Sign out">↗</button></div>
      </aside>
      <main className="main-area">
        <header className="topbar"><div className="breadcrumb">PeoplePulse <span>/</span> <strong>Workspace</strong></div><div className="topbar-right"><span className="status-dot" />All systems ready<div className="avatar small">{(user?.email?.[0] ?? 'H').toUpperCase()}</div></div></header>
        <div className="page-content"><Outlet /></div>
      </main>
    </div>
  )
}
