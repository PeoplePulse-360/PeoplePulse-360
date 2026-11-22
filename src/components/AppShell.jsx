import { useEffect, useState } from "react"
import { NavLink, Outlet } from "react-router-dom"
import { Building2, DoorOpen, LayoutDashboard, Menu, X } from "lucide-react"

const navigation = [
  { to: "/", label: "HR Analytics", icon: LayoutDashboard, end: true },
  { to: "/exit-management", label: "Exit Management", icon: DoorOpen },
]

// Dotted background from the PeoplePulse design system (CSS radial-gradient, no image).
const dottedBackground = {
  backgroundColor: "var(--bg-main, #FAFAFC)",
  backgroundImage: "radial-gradient(circle, var(--dot-color, #D8DCE5) 1px, transparent 1px)",
  backgroundSize: "14px 14px",
}

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
    <div className="min-h-screen text-[var(--text-main,#303447)]" style={{ backgroundColor: "var(--bg-main, #FAFAFC)" }}>
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
          className="fixed inset-0 z-30 bg-[#303447]/30 lg:hidden"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}

      <div className="lg:grid lg:grid-cols-[15.5rem_minmax(0,1fr)]">
        <aside
          className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-[var(--border,#E7E9F0)] bg-white transition-transform lg:sticky lg:top-0 lg:h-screen lg:w-auto lg:translate-x-0 ${
            menuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between gap-3 px-5 py-6">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-[var(--primary,#A29BEA)] text-sm font-bold tracking-wide text-white">
                PP
              </span>
              <span>
                <span className="block text-sm font-semibold leading-tight text-[var(--text-main,#303447)]">
                  PeoplePulse 360
                </span>
                <span className="block text-xs text-[var(--text-secondary,#777D91)]">Central HR</span>
              </span>
            </div>
            <button
              type="button"
              className="rounded-lg p-2 text-[var(--text-secondary,#777D91)] hover:bg-[var(--bg-muted,#F3F4F7)] lg:hidden"
              aria-label="Close menu"
              onClick={() => setMenuOpen(false)}
            >
              <X className="size-4" />
            </button>
          </div>

          <nav className="flex-1 space-y-1 px-3 py-2" aria-label="Primary">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-[13px] px-3.5 py-3 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary,#A29BEA)] ${
                      isActive
                        ? "bg-[var(--primary-light,#F0EEFC)] font-semibold text-[var(--primary-hover,#8F87DC)]"
                        : "text-[var(--text-main,#303447)] hover:bg-[var(--bg-muted,#F3F4F7)]"
                    }`
                  }
                >
                  <Icon className="size-[18px]" aria-hidden="true" />
                  {item.label}
                </NavLink>
              )
            })}
          </nav>

          <div className="m-3 rounded-2xl bg-[var(--primary-light,#F0EEFC)] p-4 text-xs leading-5 text-[var(--text-secondary,#777D91)]">
            <p className="text-sm font-semibold text-[var(--text-main,#303447)]">Smarter HR.</p>
            <p className="text-sm font-semibold text-[var(--text-main,#303447)]">Happier People.</p>
            <p className="mt-2">Sample workspace for central HR analytics.</p>
          </div>

          <div className="flex items-center gap-3 border-t border-[var(--border,#E7E9F0)] px-5 py-4">
            <span className="flex size-9 items-center justify-center rounded-full bg-[var(--secondary-light,#E9EAF8)] text-xs font-semibold text-[var(--primary-hover,#8F87DC)]">
              HR
            </span>
            <span>
              <span className="block text-sm font-medium text-[var(--text-main,#303447)]">Central HR</span>
              <span className="block text-xs text-[var(--text-muted,#A0A4B2)]">Admin</span>
            </span>
          </div>
        </aside>

        <div className="min-h-screen min-w-0" style={dottedBackground}>
          <header className="sticky top-0 z-20 flex items-center justify-between gap-3 bg-[var(--bg-main,#FAFAFC)]/90 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="rounded-xl border border-[var(--border,#E7E9F0)] bg-white p-2 text-[var(--text-secondary,#777D91)] hover:bg-[var(--bg-muted,#F3F4F7)] lg:hidden"
                aria-label="Open menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen(true)}
              >
                <Menu className="size-4" />
              </button>
              <div>
                <p className="text-sm font-semibold text-[var(--text-main,#303447)]">Demonstration workspace</p>
                <p className="text-xs text-[var(--text-secondary,#777D91)]">PeoplePulse 360 · Central HR</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-[var(--border,#E7E9F0)] bg-white px-3.5 py-2 shadow-[0_2px_8px_rgba(40,45,65,0.045)]">
              <Building2 className="size-4 text-[var(--primary-hover,#8F87DC)]" aria-hidden="true" />
              <span className="text-sm font-medium text-[var(--text-main,#303447)]">Central HR</span>
            </div>
          </header>

          <main id="content" className="mx-auto w-full max-w-[1440px] px-4 pb-10 pt-2 sm:px-6 lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}