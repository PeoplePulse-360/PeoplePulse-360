import { useEffect, useMemo, useState } from "react"
import {
  Search,
  Plus,
  Users,
  DoorOpen,
  CalendarDays,
  MessageSquare,
  X,
  ClipboardList,
  LogOut,
  Loader2,
} from "lucide-react"
import { supabase } from "../lib/supabaseClient"

// Theme: uses the shared PeoplePulse variables, with the official hex values as fallbacks.
const card =
  "rounded-[20px] border border-[var(--border,#E7E9F0)] bg-white shadow-[0_2px_8px_rgba(40,45,65,0.045)]"
const inputBase =
  "w-full rounded-xl border border-[var(--border,#E7E9F0)] bg-white text-[var(--text-main,#303447)] outline-none focus:border-[var(--primary,#A29BEA)] focus:ring-[3px] focus:ring-[var(--primary-light,#F0EEFC)]"
const btnPrimary =
  "rounded-xl bg-[var(--primary,#A29BEA)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--primary-hover,#8F87DC)] disabled:opacity-60"
const btnSecondary =
  "rounded-xl border border-[var(--border,#E7E9F0)] bg-white px-4 py-2.5 text-sm font-medium text-[var(--text-main,#303447)] hover:bg-[var(--bg-muted,#F3F4F7)]"
const iconCircle =
  "grid h-11 w-11 place-items-center rounded-full bg-[var(--primary-light,#F0EEFC)] text-[var(--primary-hover,#8F87DC)]"

const statusStyles = {
  "In Progress":
    "bg-[color-mix(in_srgb,var(--warning,#E8B66F)_20%,white)] text-[var(--text-main,#303447)]",
  "Interview Scheduled":
    "bg-[color-mix(in_srgb,var(--info,#8C9FD5)_20%,white)] text-[var(--text-main,#303447)]",
  Completed:
    "bg-[color-mix(in_srgb,var(--success,#68B99A)_20%,white)] text-[var(--text-main,#303447)]",
  Cancelled: "bg-[var(--bg-muted,#F3F4F7)] text-[var(--text-secondary,#777D91)]",
}

const ACTIVE_STATUSES = ["In Progress", "Interview Scheduled"]

const emptyForm = {
  employeeId: "",
  reason: "Career Growth",
  resignationDate: "",
  lastWorkingDay: "",
  status: "In Progress",
}

function todayLocal() {
  const d = new Date()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${d.getFullYear()}-${month}-${day}`
}

function friendlyError(error) {
  if (error?.code === "23505") return "This employee already has an active exit record."
  if (error?.code === "23514") return "Please check the dates and required fields."
  if (error?.code === "42501") return "Permission denied. Please sign out and sign in again."
  return error?.message || "Something went wrong. Please try again."
}

// Loads employees + exit records (with interview feedback) from Supabase.
async function fetchExitData() {
  if (!supabase) return { employees: [], exits: [], error: "Supabase is not configured." }

  const [employeesResult, exitsResult] = await Promise.all([
    supabase
      .from("employee_directory")
      .select("id, emp_id, full_name, department, designation, joining_date, status")
      .order("full_name", { ascending: true }),
    supabase
      .from("exit_records")
      .select(
        "id, employee_id, reason, resignation_date, last_working_day, status, created_at, exit_interviews(id, feedback, interview_date)"
      )
      .order("created_at", { ascending: false }),
  ])

  if (employeesResult.error) return { employees: [], exits: [], error: friendlyError(employeesResult.error) }
  if (exitsResult.error) return { employees: [], exits: [], error: friendlyError(exitsResult.error) }

  const employees = employeesResult.data
  const employeeMap = new Map(employees.map((employee) => [employee.id, employee]))

  const exits = exitsResult.data.map((row) => {
    const employee = employeeMap.get(row.employee_id)
    const interview = Array.isArray(row.exit_interviews)
      ? row.exit_interviews[0]
      : row.exit_interviews

    return {
      id: row.id,
      employeeId: row.employee_id,
      empCode: employee?.emp_id ?? "—",
      employeeName: employee?.full_name ?? "Unknown employee",
      department: employee?.department ?? "—",
      reason: row.reason,
      resignationDate: row.resignation_date,
      lastWorkingDay: row.last_working_day,
      status: row.status,
      interview: interview?.feedback ?? "",
    }
  })

  return { employees, exits, error: "" }
}

export default function ExitManagement() {
  const [employees, setEmployees] = useState([])
  const [exits, setExits] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [reloadKey, setReloadKey] = useState(0)
  const [saving, setSaving] = useState(false)

  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("All")
  const [showForm, setShowForm] = useState(false)
  const [selectedExit, setSelectedExit] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [interviewText, setInterviewText] = useState("")
  const [message, setMessage] = useState(null) // { type: "success" | "error", text }

  useEffect(() => {
    let cancelled = false
    fetchExitData().then((result) => {
      if (cancelled) return
      setEmployees(result.employees)
      setExits(result.exits)
      setLoadError(result.error)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [reloadKey])

  function refresh() {
    setReloadKey((key) => key + 1)
  }

  function showSuccess(text) {
    setMessage({ type: "success", text })
  }

  function showError(text) {
    setMessage({ type: "error", text })
  }

  const activeEmployeeIds = useMemo(
    () => new Set(exits.filter((exit) => ACTIVE_STATUSES.includes(exit.status)).map((exit) => exit.employeeId)),
    [exits]
  )

  const filteredExits = useMemo(() => {
    const term = search.toLowerCase()
    return exits.filter((exit) => {
      const matchesSearch =
        exit.employeeName.toLowerCase().includes(term) ||
        exit.empCode.toLowerCase().includes(term) ||
        exit.department.toLowerCase().includes(term)

      const matchesFilter = filter === "All" || exit.status === filter
      return matchesSearch && matchesFilter
    })
  }, [exits, search, filter])

  const activeExits = exits.filter((exit) => ACTIVE_STATUSES.includes(exit.status)).length
  const completedExits = exits.filter((exit) => exit.status === "Completed").length

  async function handleAddExit(event) {
    event.preventDefault()

    const employee = employees.find((item) => item.id === form.employeeId)

    if (!employee) {
      showError("Please select an employee.")
      return
    }

    if (activeEmployeeIds.has(employee.id)) {
      showError("This employee already has an active exit record.")
      return
    }

    if (form.lastWorkingDay < form.resignationDate) {
      showError("Last working day cannot be before the resignation date.")
      return
    }

    setSaving(true)
    const { error } = await supabase.from("exit_records").insert({
      employee_id: employee.id,
      reason: form.reason,
      resignation_date: form.resignationDate,
      last_working_day: form.lastWorkingDay,
      status: form.status,
    })
    setSaving(false)

    if (error) {
      showError(friendlyError(error))
      return
    }

    setForm(emptyForm)
    setShowForm(false)
    showSuccess("Exit record added successfully.")
    refresh()
  }

  async function saveInterview() {
    if (!interviewText.trim()) {
      showError("Please enter interview feedback first.")
      return
    }

    setSaving(true)
    const { error } = await supabase.from("exit_interviews").upsert(
      {
        exit_record_id: selectedExit.id,
        interview_date: todayLocal(),
        feedback: interviewText.trim(),
      },
      { onConflict: "exit_record_id" }
    )
    setSaving(false)

    if (error) {
      showError(friendlyError(error))
      return
    }

    setSelectedExit(null)
    setInterviewText("")
    showSuccess("Exit interview feedback saved successfully.")
    refresh()
  }

  async function updateStatus(id, status) {
    const { error } = await supabase.from("exit_records").update({ status }).eq("id", id)

    if (error) {
      showError(friendlyError(error))
      refresh() // put the dropdown back to the saved value
      return
    }

    showSuccess("Exit status updated.")
    refresh()
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-16 text-sm text-[var(--text-secondary,#777D91)]">
        <Loader2 size={18} className="animate-spin" /> Loading exit records…
      </div>
    )
  }

  if (loadError) {
    return (
      <div className={`${card} border-l-4 border-l-[var(--danger,#E58B9E)] p-6 text-sm text-[var(--text-main,#303447)]`}>
        <p className="font-semibold">Could not load exit data</p>
        <p className="mt-1 text-[var(--text-secondary,#777D91)]">{loadError}</p>
        <button
          onClick={() => {
            setLoading(true)
            setLoadError("")
            refresh()
          }}
          className={`${btnPrimary} mt-4 !px-3 !py-1.5 text-xs`}
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-[var(--primary-hover,#8F87DC)]">PeoplePulse 360 / HR</p>
          <h1 className="mt-1 text-2xl font-bold text-[var(--text-main,#303447)]">Exit Management</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary,#777D91)]">
            Manage employee departures, exit records and interview feedback.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handleSignOut} className={`${btnSecondary} inline-flex items-center gap-2`}>
            <LogOut size={16} /> Sign out
          </button>
          <button
            onClick={() => {
              setMessage(null)
              setShowForm(true)
            }}
            className={`${btnPrimary} inline-flex items-center gap-2`}
          >
            <Plus size={17} /> Add Exit Record
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`flex items-center justify-between rounded-xl border bg-white px-4 py-3 text-sm text-[var(--text-main,#303447)] ${
            message.type === "error"
              ? "border-[var(--danger,#E58B9E)]"
              : "border-[var(--primary,#A29BEA)] bg-[var(--primary-light,#F0EEFC)]"
          }`}
        >
          {message.text}
          <button onClick={() => setMessage(null)} aria-label="Dismiss message">
            <X size={16} />
          </button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className={`${card} flex items-center gap-4 p-5`}>
          <div className={iconCircle}>
            <DoorOpen size={21} />
          </div>
          <div>
            <p className="text-sm text-[var(--text-secondary,#777D91)]">Total Exits</p>
            <p className="text-3xl font-bold text-[var(--text-main,#303447)]">{exits.length}</p>
            <p className="text-xs text-[var(--text-muted,#A0A4B2)]">All recorded departures</p>
          </div>
        </div>

        <div className={`${card} flex items-center gap-4 p-5`}>
          <div className={iconCircle}>
            <Users size={21} />
          </div>
          <div>
            <p className="text-sm text-[var(--text-secondary,#777D91)]">Active Exit Processes</p>
            <p className="text-3xl font-bold text-[var(--text-main,#303447)]">{activeExits}</p>
            <p className="text-xs text-[var(--text-muted,#A0A4B2)]">Not yet completed or cancelled</p>
          </div>
        </div>

        <div className={`${card} flex items-center gap-4 p-5`}>
          <div className={iconCircle}>
            <CalendarDays size={21} />
          </div>
          <div>
            <p className="text-sm text-[var(--text-secondary,#777D91)]">Completed Exits</p>
            <p className="text-3xl font-bold text-[var(--text-main,#303447)]">{completedExits}</p>
            <p className="text-xs text-[var(--text-muted,#A0A4B2)]">Successfully completed processes</p>
          </div>
        </div>
      </div>

      <div className={card}>
        <div className="flex flex-col gap-3 border-b border-[var(--border,#E7E9F0)] p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-semibold text-[var(--text-main,#303447)]">Employee Exit Records</h2>
            <p className="mt-1 text-xs text-[var(--text-secondary,#777D91)]">
              Search and manage employee departure records.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted,#A0A4B2)]"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search employees..."
                className={`${inputBase} py-2 pl-9 pr-3 text-sm sm:w-56`}
              />
            </div>

            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className={`${inputBase} !w-auto px-3 py-2 text-sm`}
            >
              <option>All</option>
              <option>In Progress</option>
              <option>Interview Scheduled</option>
              <option>Completed</option>
              <option>Cancelled</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="bg-[var(--bg-muted,#F3F4F7)] text-xs uppercase tracking-wide text-[var(--text-secondary,#777D91)]">
              <tr>
                <th className="px-5 py-3">Employee</th>
                <th className="px-5 py-3">Reason</th>
                <th className="px-5 py-3">Resignation Date</th>
                <th className="px-5 py-3">Last Working Day</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border,#E7E9F0)]">
              {filteredExits.map((exit) => (
                <tr key={exit.id} className="hover:bg-[var(--bg-muted,#F3F4F7)]/60">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-[var(--text-main,#303447)]">{exit.employeeName}</p>
                    <p className="mt-1 text-xs text-[var(--text-secondary,#777D91)]">
                      {exit.empCode} · {exit.department}
                    </p>
                  </td>
                  <td className="px-5 py-4 text-[var(--text-secondary,#777D91)]">{exit.reason}</td>
                  <td className="px-5 py-4 text-[var(--text-secondary,#777D91)]">{exit.resignationDate}</td>
                  <td className="px-5 py-4 text-[var(--text-secondary,#777D91)]">{exit.lastWorkingDay}</td>
                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[exit.status]}`}
                    >
                      {exit.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedExit(exit)
                          setInterviewText(exit.interview)
                          setMessage(null)
                        }}
                        title="View and record interview"
                        className="rounded-lg border border-[var(--border,#E7E9F0)] p-2 text-[var(--text-secondary,#777D91)] hover:bg-[var(--primary-light,#F0EEFC)] hover:text-[var(--primary-hover,#8F87DC)]"
                      >
                        <MessageSquare size={16} />
                      </button>
                      <select
                        value={exit.status}
                        onChange={(event) => updateStatus(exit.id, event.target.value)}
                        aria-label={`Update status for ${exit.employeeName}`}
                        className={`${inputBase} !w-auto max-w-40 px-2 py-2 text-xs`}
                      >
                        <option>In Progress</option>
                        <option>Interview Scheduled</option>
                        <option>Completed</option>
                        <option>Cancelled</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredExits.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-5 py-12 text-center">
                    <ClipboardList className="mx-auto mb-3 text-[var(--secondary,#B8C0E8)]" size={30} />
                    <p className="font-medium text-[var(--text-main,#303447)]">No exit records found</p>
                    <p className="mt-1 text-xs text-[var(--text-secondary,#777D91)]">
                      {exits.length === 0
                        ? "No exits have been recorded yet. Click “Add Exit Record” to create one."
                        : "Try changing your search or filter."}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#303447]/40 p-4">
          <div className="my-8 w-full max-w-xl rounded-[20px] bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-[var(--text-main,#303447)]">Add Exit Record</h2>
                <p className="mt-1 text-xs text-[var(--text-secondary,#777D91)]">Enter employee departure details.</p>
              </div>
              <button onClick={() => setShowForm(false)} aria-label="Close form">
                <X className="text-[var(--text-secondary,#777D91)]" />
              </button>
            </div>

            {employees.length === 0 && (
              <div className="mb-4 rounded-xl border border-[var(--warning,#E8B66F)] bg-white p-3 text-xs text-[var(--text-main,#303447)]">
                No employees were found in the employees table yet. Employee records
                are created by another team module, so the dropdown stays empty until
                they exist.
              </div>
            )}

            {message?.type === "error" && (
              <div className="mb-4 rounded-xl border border-[var(--danger,#E58B9E)] bg-white p-3 text-xs text-[var(--text-main,#303447)]">
                {message.text}
              </div>
            )}

            <form onSubmit={handleAddExit} className="space-y-4">
              <label className="block text-sm font-medium text-[var(--text-main,#303447)]">
                Select Employee
                <select
                  required
                  value={form.employeeId}
                  onChange={(event) => setForm({ ...form, employeeId: event.target.value })}
                  className={`${inputBase} mt-1.5 px-3 py-2.5 font-normal`}
                >
                  <option value="">Choose an employee</option>
                  {employees.map((employee) => {
                    const hasActiveExit = activeEmployeeIds.has(employee.id)
                    return (
                      <option key={employee.id} value={employee.id} disabled={hasActiveExit}>
                        {employee.full_name} — {employee.emp_id} ({employee.department})
                        {hasActiveExit ? " — exit in progress" : ""}
                      </option>
                    )
                  })}
                </select>
              </label>

              <label className="block text-sm font-medium text-[var(--text-main,#303447)]">
                Reason for Leaving
                <select
                  value={form.reason}
                  onChange={(event) => setForm({ ...form, reason: event.target.value })}
                  className={`${inputBase} mt-1.5 px-3 py-2.5 font-normal`}
                >
                  <option>Career Growth</option>
                  <option>Higher Studies</option>
                  <option>Personal Reasons</option>
                  <option>Relocation</option>
                  <option>Compensation</option>
                  <option>Work Environment</option>
                  <option>Retirement</option>
                  <option>Other</option>
                </select>
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-[var(--text-main,#303447)]">
                  Resignation Date
                  <input
                    required
                    type="date"
                    value={form.resignationDate}
                    onChange={(event) => setForm({ ...form, resignationDate: event.target.value })}
                    className={`${inputBase} mt-1.5 px-3 py-2.5 font-normal`}
                  />
                </label>

                <label className="block text-sm font-medium text-[var(--text-main,#303447)]">
                  Last Working Day
                  <input
                    required
                    type="date"
                    min={form.resignationDate || undefined}
                    value={form.lastWorkingDay}
                    onChange={(event) => setForm({ ...form, lastWorkingDay: event.target.value })}
                    className={`${inputBase} mt-1.5 px-3 py-2.5 font-normal`}
                  />
                </label>
              </div>

              <label className="block text-sm font-medium text-[var(--text-main,#303447)]">
                Exit Status
                <select
                  value={form.status}
                  onChange={(event) => setForm({ ...form, status: event.target.value })}
                  className={`${inputBase} mt-1.5 px-3 py-2.5 font-normal`}
                >
                  <option>In Progress</option>
                  <option>Interview Scheduled</option>
                  <option>Completed</option>
                  <option>Cancelled</option>
                </select>
              </label>

              <div className="flex justify-end gap-3 border-t border-[var(--border,#E7E9F0)] pt-4">
                <button type="button" onClick={() => setShowForm(false)} className={btnSecondary}>
                  Cancel
                </button>
                <button type="submit" disabled={saving} className={btnPrimary}>
                  {saving ? "Saving…" : "Save Exit Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedExit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#303447]/40 p-4">
          <div className="my-8 w-full max-w-xl rounded-[20px] bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-[var(--text-main,#303447)]">Exit Interview</h2>
                <p className="mt-1 text-sm text-[var(--text-secondary,#777D91)]">
                  {selectedExit.employeeName} · {selectedExit.empCode}
                </p>
              </div>
              <button onClick={() => setSelectedExit(null)} aria-label="Close interview">
                <X className="text-[var(--text-secondary,#777D91)]" />
              </button>
            </div>

            {message?.type === "error" && (
              <div className="mb-4 rounded-xl border border-[var(--danger,#E58B9E)] bg-white p-3 text-xs text-[var(--text-main,#303447)]">
                {message.text}
              </div>
            )}

            <div className="mb-4 rounded-xl bg-[var(--bg-muted,#F3F4F7)] p-4 text-sm">
              <p className="font-semibold text-[var(--text-main,#303447)]">Departure details</p>
              <p className="mt-2 text-[var(--text-secondary,#777D91)]">Department: {selectedExit.department}</p>
              <p className="mt-1 text-[var(--text-secondary,#777D91)]">Reason: {selectedExit.reason}</p>
              <p className="mt-1 text-[var(--text-secondary,#777D91)]">Last working day: {selectedExit.lastWorkingDay}</p>
            </div>

            <label className="block text-sm font-medium text-[var(--text-main,#303447)]">
              Interview Feedback / Employee Comments
              <textarea
                rows="5"
                value={interviewText}
                onChange={(event) => setInterviewText(event.target.value)}
                placeholder="Record feedback from the employee's exit interview..."
                className={`${inputBase} mt-2 p-3 font-normal`}
              />
            </label>

            <div className="mt-5 flex justify-end gap-3">
              <button onClick={() => setSelectedExit(null)} className={btnSecondary}>
                Close
              </button>
              <button onClick={saveInterview} disabled={saving} className={btnPrimary}>
                {saving ? "Saving…" : "Save Interview"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}