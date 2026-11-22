import {
  Activity,
  BarChart3,
  BriefcaseBusiness,
  CalendarCheck,
  CalendarDays,
  ChevronRight,
  ClipboardCheck,
  DoorOpen,
  Gauge,
  LayoutDashboard,
  LogOut,
  MessageSquareText,
  Plane,
  ShieldAlert,
  Sparkles,
  UsersRound,
} from 'lucide-react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider.jsx'
import { getUserDisplayName, getUserInitials } from '../utils/userDisplay.js'

const groups = [
  {
    title: 'WORKSPACE',
    links: [
      ['/', 'Dashboard', LayoutDashboard],
      ['/employees', 'Employees', UsersRound],
      ['/recruitment', 'Recruitment', BriefcaseBusiness],
    ],
  },
  {
    title: 'PEOPLE OPERATIONS',
    links: [
      ['/attendance', 'Attendance', CalendarCheck],
      ['/leave', 'Leave management', Plane],
      ['/onboarding', 'Onboarding', ClipboardCheck],
      ['/performance', 'Performance', BarChart3],
      ['/feedback', 'Feedback', MessageSquareText],
      ['/grievances', 'Grievances', ShieldAlert],
      ['/exits', 'Exit management', DoorOpen],
    ],
  },
  {
    title: 'INTELLIGENCE',
    links: [
      ['/analytics', 'HR analytics', Activity],
      ['/analytics/people', 'People insights', Sparkles],
      ['/ai/journey', 'Journey insights', Sparkles],
      ['/ai/workload', 'Workload insights', Gauge],
      ['/simulator', 'What-if simulator', CalendarDays],
    ],
  },
]

const routeNames = groups.flatMap((group) => group.links.map(([to, label]) => [to, label]))

export default function AppLayout() {
  const { user, signOut } = useAuth()
  const displayName = getUserDisplayName(user)
  const initials = getUserInitials(displayName)
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const currentPage = routeNames.find(([path]) => path === pathname)?.[1] ?? 'Dashboard'

  async function handleSignOut() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark"><UsersRound size={20} strokeWidth={2.1} /></span>
          <span className="brand-name">PeoplePulse<span className="brand-light">360</span></span>
        </div>
        <nav aria-label="Main navigation">
          {groups.map((group) => <section className="nav-group" key={group.title}>
            <p className="nav-heading">{group.title}</p>
            {group.links.map(([to, label, Icon]) => <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              <Icon className="nav-icon" size={17} strokeWidth={1.8} aria-hidden="true" />
              <span>{label}</span>
            </NavLink>)}
          </section>)}
        </nav>
        <div className="sidebar-footer">
          <div className="avatar">{initials}</div>
          <div className="profile-copy"><strong>{displayName}</strong><span>Admin</span></div>
          <button className="icon-button" onClick={handleSignOut} title="Sign out" aria-label="Sign out"><LogOut size={17} /></button>
        </div>
      </aside>
      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumb"><span>PeoplePulse 360</span><ChevronRight size={14} /><strong>{currentPage}</strong></div>
          <div className="topbar-right">
            <div className="avatar small">{initials}</div>
          </div>
        </header>
        <div className="page-content"><div className="route-content" key={pathname}><Outlet /></div></div>
      </main>
    </div>
  )
}
