import { useEffect, useState } from "react"
import { supabase, isSupabaseConfigured } from "./supabaseClient"

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

function shortenDepartment(name) {
  if (name === "Human Resources") return "HR"
  if (name === "Customer Success") return "Cust. Success"
  return name
}

// "2026-11-01" -> "Nov 26"
function monthLabel(dateText) {
  const [year, month] = String(dateText).slice(0, 7).split("-")
  return `${MONTHS[Number(month) - 1]} ${year.slice(2)}`
}

function num(value) {
  return Number(value) || 0
}

// Turns the read-only analytics views into the shapes the dashboard charts expect.
export function buildLiveAnalytics(rows) {
  const departments = rows.headcount
    .filter((row) => num(row.employees) > 0)
    .map((row) => ({
      name: row.department,
      shortName: shortenDepartment(row.department),
      employees: num(row.employees),
      newHires: num(row.new_hires),
    }))
    .sort((a, b) => b.employees - a.employees || a.name.localeCompare(b.name))

  const employees = departments.reduce((sum, row) => sum + row.employees, 0)
  const newEmployees = departments.reduce((sum, row) => sum + row.newHires, 0)

  const workforceMix = rows.employeeStatus
    .map((row) => ({ name: row.status, value: num(row.employees) }))
    .filter((row) => row.value > 0)

  const recruitmentRow = rows.recruitment[0] || {}
  const recruitment = {
    openings: num(recruitmentRow.open_jobs),
    candidates: num(recruitmentRow.candidates),
    applications: num(recruitmentRow.applications),
    selected: num(recruitmentRow.selected),
    rejected: num(recruitmentRow.rejected),
    inReview: num(recruitmentRow.in_review),
  }

  const recruitmentTrend = rows.applicationsMonthly
    .filter((row) => row.month)
    .sort((a, b) => String(a.month).localeCompare(String(b.month)))
    .map((row) => ({
      month: monthLabel(row.month),
      applications: num(row.applications),
      selected: num(row.selected),
      rejected: num(row.rejected),
    }))

  const todayRow = rows.attendanceToday[0] || {}
  const attendance = {
    present: num(todayRow.present),
    absent: num(todayRow.absent),
    onLeave: num(todayRow.on_leave),
  }
  const attendanceTotal = attendance.present + attendance.absent + attendance.onLeave
  const attendanceScheduled = attendance.present + attendance.absent
  attendance.rate = attendanceScheduled
    ? Math.round((attendance.present / attendanceScheduled) * 1000) / 10
    : 0

  const monthlyAttendance = rows.attendanceMonthly
    .filter((row) => row.month && num(row.present) + num(row.absent) > 0)
    .sort((a, b) => String(a.month).localeCompare(String(b.month)))
    .map((row) => ({
      month: monthLabel(row.month),
      rate: Math.round((num(row.present) / (num(row.present) + num(row.absent))) * 1000) / 10,
    }))

  const leave = { pending: 0, approved: 0, rejected: 0 }
  rows.leaveStatus.forEach((row) => {
    const status = String(row.status).toLowerCase()
    if (status.startsWith("pend")) leave.pending += num(row.requests)
    else if (status.startsWith("approv")) leave.approved += num(row.requests)
    else if (status.startsWith("reject")) leave.rejected += num(row.requests)
  })

  return {
    departments,
    employees,
    newEmployees,
    workforceMix,
    recruitment,
    recruitmentTrend,
    attendance,
    monthlyAttendance,
    leave,
    // Sections only switch to live data when the database actually has rows for them.
    hasEmployees: employees > 0,
    hasRecruitment: recruitment.applications > 0 || recruitment.candidates > 0,
    hasAttendance: attendanceTotal > 0,
    hasAttendanceTrend: monthlyAttendance.length > 0,
    hasLeave: leave.pending + leave.approved + leave.rejected > 0,
  }
}

// status: "loading" | "live" | "demo" (not signed in) | "error"
export function useLiveAnalytics() {
  const [state, setState] = useState({
    status: isSupabaseConfigured ? "loading" : "demo",
    data: null,
    error: "",
  })

  useEffect(() => {
    if (!supabase) return undefined
    let cancelled = false

    async function load(session) {
      if (!session) {
        if (!cancelled) setState({ status: "demo", data: null, error: "" })
        return
      }

      const results = await Promise.all([
        supabase.from("analytics_headcount").select("*"),
        supabase.from("analytics_employee_status").select("*"),
        supabase.from("analytics_recruitment").select("*"),
        supabase.from("analytics_applications_monthly").select("*"),
        supabase.from("analytics_attendance_monthly").select("*"),
        supabase.from("analytics_attendance_today").select("*"),
        supabase.from("analytics_leave_status").select("*"),
      ])
      if (cancelled) return

      const failure = results.find((result) => result.error)
      if (failure) {
        setState({ status: "error", data: null, error: failure.error.message })
        return
      }

      const [headcount, employeeStatus, recruitment, applicationsMonthly, attendanceMonthly, attendanceToday, leaveStatus] =
        results.map((result) => result.data)

      setState({
        status: "live",
        data: buildLiveAnalytics({
          headcount,
          employeeStatus,
          recruitment,
          applicationsMonthly,
          attendanceMonthly,
          attendanceToday,
          leaveStatus,
        }),
        error: "",
      })
    }

    supabase.auth.getSession().then(({ data }) => load(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      load(session)
    })

    return () => {
      cancelled = true
      listener.subscription.unsubscribe()
    }
  }, [])

  return state
}