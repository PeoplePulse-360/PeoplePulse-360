import { useEffect, useState } from "react"
import { NavLink, Outlet } from "react-router-dom"
import { Briefcase, DoorOpen, LayoutDashboard, Menu, Users, X } from "lucide-react"

const navigation = [
  { to: "/", label: "HR Analytics", icon: LayoutDashboard, end: true },
  { to: "/employees", label: "Employees", icon: Users },
  { to: "/recruitment", label: "Recruitment", icon: Briefcase },
  { to: "/attendance", label: "Attendance", icon: Users },
]
export default function AppShell() {
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (!menuOpen) return undefined

    function onKeyDown(event) {
      if (event.key === "Escape") setMenuOpen(false)
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [menuOpen])

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:shadow"
      >
        Skip to content
      </a>

      {menuOpen ? (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}

      <div className="lg:grid lg:grid-cols-[18rem_minmax(0,1fr)]">
        <aside
          className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-navy-900 text-white transition-transform lg:sticky lg:top-0 lg:h-screen lg:w-auto lg:translate-x-0 ${
            menuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-5">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-indigo-500 text-sm font-bold tracking-wide">
                PP
              </span>
              <span>
                <span className="block text-sm font-semibold tracking-wide">PEOPLEPULSE 360</span>
                <span className="block text-xs text-slate-300">Central HR</span>
              </span>
            </div>
            <button
              type="button"
              className="rounded-lg p-2 text-slate-300 hover:bg-white/10 hover:text-white lg:hidden"
              aria-label="Close menu"
              onClick={() => setMenuOpen(false)}
            >
              <X className="size-4" />
            </button>
          </div>

          <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Primary">
            <p className="px-3 pb-2 text-[11px] font-semibold tracking-[0.16em] text-slate-400 uppercase">
              Workspace
            </p>
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300 ${
                      isActive ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/5 hover:text-white"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon className={`size-4 ${isActive ? "text-indigo-300" : "text-slate-400"}`} aria-hidden="true" />
                      {item.label}
                    </>
                  )}
                </NavLink>
              )
            })}

            <div className="mt-2 rounded-xl px-3 py-2.5">
              <div className="flex items-center gap-3 text-sm text-slate-400">
                <DoorOpen className="size-4" aria-hidden="true" />
                <span className="flex-1">Exit Management</span>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-slate-300 uppercase">
                  Soon
                </span>
              </div>
              <p className="mt-2 pl-7 text-xs leading-5 text-slate-400">
                Exit records and interviews open in the next release.
              </p>
            </div>
          </nav>

          <div className="border-t border-white/10 px-5 py-4 text-xs leading-5 text-slate-400">
            Sample workspace for central HR analytics.
          </div>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 lg:hidden"
                aria-label="Open menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen(true)}
              >
                <Menu className="size-4" />
              </button>
              <div>
                <p className="text-sm font-semibold text-slate-900">Demonstration workspace</p>
                <p className="text-xs text-slate-500">PeoplePulse 360 · Central HR</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
              <span className="flex size-7 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-semibold text-white">
                HR
              </span>
              <span className="hidden text-sm font-medium text-slate-700 sm:inline">Central HR</span>
            </div>
          </header>

          <main id="content" className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
