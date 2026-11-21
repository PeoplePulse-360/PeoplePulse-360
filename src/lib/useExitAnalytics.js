import { useEffect, useState } from "react"
import { supabase, isSupabaseConfigured } from "./supabaseClient"

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

function shortenDepartment(name) {
  if (name === "Human Resources") return "HR"
  if (name === "Customer Success") return "Cust. Success"
  return name
}

function tally(items) {
  const counts = new Map()
  items.forEach((item) => counts.set(item, (counts.get(item) || 0) + 1))
  return counts
}

// Turns raw database rows into the numbers the dashboard charts need.
// Cancelled exit processes are NOT counted as exits.
export function buildExitAnalytics(records, employees) {
  const counted = records.filter((record) => record.status !== "Cancelled")
  const employeeById = new Map(employees.map((employee) => [employee.id, employee]))

  // Departments: every department that has employees, even with 0 exits.
  const deptCounts = new Map()
  employees.forEach((employee) => {
    deptCounts.set(employee.department || "Unassigned", 0)
  })
  counted.forEach((record) => {
    const department = employeeById.get(record.employee_id)?.department || "Unassigned"
    deptCounts.set(department, (deptCounts.get(department) || 0) + 1)
  })
  const departments = [...deptCounts]
    .map(([name, exits]) => ({ name, shortName: shortenDepartment(name), exits }))
    .sort((a, b) => b.exits - a.exits || a.name.localeCompare(b.name))

  // Exit reasons
  const reasons = [...tally(counted.map((record) => record.reason))]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))

  // Monthly trend, by last working day (YYYY-MM taken straight from the date text)
  const monthly = [...tally(counted.map((record) => record.last_working_day.slice(0, 7)))]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, count]) => {
      const [year, month] = key.split("-")
      return { month: `${MONTHS[Number(month) - 1]} ${year}`, count }
    })

  // Average tenure at exit, in years (only where a joining date exists)
  const tenures = counted
    .map((record) => {
      const joined = employeeById.get(record.employee_id)?.joining_date
      if (!joined) return null
      const days = (Date.parse(record.last_working_day) - Date.parse(joined)) / 86400000
      return days >= 0 ? days / 365.25 : null
    })
    .filter((value) => value !== null)
  const averageTenureYears = tenures.length
    ? Math.round((tenures.reduce((sum, value) => sum + value, 0) / tenures.length) * 10) / 10
    : null

  return {
    totalExits: counted.length,
    activeExits: counted.filter((record) => record.status !== "Completed").length,
    completedExits: counted.filter((record) => record.status === "Completed").length,
    departments,
    reasons,
    monthly,
    averageTenureYears,
  }
}

// status: "loading" | "live" | "demo" (not signed in) | "error"
export function useExitAnalytics() {
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

      const [recordsResult, employeesResult] = await Promise.all([
        supabase
          .from("exit_records")
          .select("id, employee_id, reason, resignation_date, last_working_day, status"),
        supabase.from("employee_directory").select("id, department, joining_date"),
      ])
      if (cancelled) return

      const failure = recordsResult.error || employeesResult.error
      if (failure) {
        setState({ status: "error", data: null, error: failure.message })
        return
      }

      setState({
        status: "live",
        data: buildExitAnalytics(recordsResult.data, employeesResult.data),
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