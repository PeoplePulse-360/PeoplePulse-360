import { useEffect, useState } from 'react'
import { dashboardSummary as demoSummary, departments as demoDepartments, exitReasons as demoExitReasons, feedbackSentiment as demoFeedbackSentiment, feedbackTrend as demoFeedbackTrend, monthlyAttendance as demoMonthlyAttendance, recruitmentTrend as demoRecruitmentTrend, reportingPeriod as demoReportingPeriod, workforceMix as demoWorkforceMix } from '../data/analytics.js'
import { isSupabaseConfigured, supabase } from './supabase.js'

const demoData = {
  summary: demoSummary,
  departments: demoDepartments,
  exitReasons: demoExitReasons,
  feedbackSentiment: demoFeedbackSentiment,
  feedbackTrend: demoFeedbackTrend,
  monthlyAttendance: demoMonthlyAttendance,
  recruitmentTrend: demoRecruitmentTrend,
  reportingPeriod: demoReportingPeriod,
  workforceMix: demoWorkforceMix,
}

function monthKey(date) {
  return String(date ?? '').slice(0, 7)
}

function monthLabel(key) {
  return new Date(`${key}-01T00:00:00`).toLocaleString(undefined, { month: 'short' })
}

function shortDepartment(name) {
  if (name.toLowerCase() === 'human resources') return 'HR'
  return name.length > 13 ? `${name.slice(0, 11)}…` : name
}

function average(values) {
  const usable = values.map(Number).filter(Number.isFinite)
  return usable.length ? usable.reduce((sum, value) => sum + value, 0) / usable.length : 0
}

function buildLiveData(rows) {
  const { employees, attendance, leaves, jobs, candidates, applications, reviews, goals, feedback, exits } = rows
  const now = new Date()
  const today = now.toISOString().slice(0, 10)
  const year = now.getFullYear()
  const monthStart = new Date(year, now.getMonth(), 1).toISOString().slice(0, 10)
  const newHireStart = new Date(now.getTime() - 30 * 86400000).toISOString().slice(0, 10)
  const employeesById = new Map(employees.map((row) => [row.id, row]))
  const departmentsByName = new Map()

  for (const employee of employees) {
    const name = employee.department || 'Unassigned'
    const item = departmentsByName.get(name) ?? { name, shortName: shortDepartment(name), employees: 0, newHires: 0, exits: 0, ratings: [], goalsCompleted: 0, goalsInProgress: 0, goalsNotStarted: 0 }
    if (String(employee.status ?? 'Active').toLowerCase() === 'active') item.employees += 1
    if (employee.joining_date >= newHireStart) item.newHires += 1
    departmentsByName.set(name, item)
  }

  for (const review of reviews) {
    const department = employeesById.get(review.employee_id)?.department || 'Unassigned'
    const item = departmentsByName.get(department)
    if (item && review.rating != null) item.ratings.push(Number(review.rating))
  }
  for (const goal of goals) {
    const department = employeesById.get(goal.employee_id)?.department || 'Unassigned'
    const item = departmentsByName.get(department)
    if (!item) continue
    const status = String(goal.status ?? '').toLowerCase()
    if (status === 'completed' || Number(goal.progress) >= 100) item.goalsCompleted += 1
    else if (status === 'in_progress') item.goalsInProgress += 1
    else item.goalsNotStarted += 1
  }
  for (const exit of exits) {
    if (String(exit.status ?? '').toLowerCase() === 'cancelled') continue
    const department = employeesById.get(exit.employee_id)?.department || 'Unassigned'
    const item = departmentsByName.get(department)
    if (item) item.exits += 1
  }

  const currentAttendance = attendance.filter((row) => row.attendance_date === today)
  const attendanceMonths = new Map()
  for (const row of attendance) {
    const key = monthKey(row.attendance_date)
    if (!key || !key.startsWith(String(year))) continue
    const item = attendanceMonths.get(key) ?? { present: 0, recorded: 0 }
    item.recorded += 1
    if (['present', 'late', 'half day'].includes(String(row.status ?? '').toLowerCase())) item.present += 1
    attendanceMonths.set(key, item)
  }
  const months = Array.from({ length: now.getMonth() + 1 }, (_, index) => `${year}-${String(index + 1).padStart(2, '0')}`)
  const monthlyAttendance = months.map((month) => {
    const counts = attendanceMonths.get(month) ?? { present: 0, recorded: 0 }
    return { month: monthLabel(month), rate: counts.recorded ? Math.round(counts.present / counts.recorded * 1000) / 10 : 0 }
  })

  const recruitmentByMonth = new Map()
  for (const application of applications) {
    const key = monthKey(application.applied_date)
    if (!key || !key.startsWith(String(year))) continue
    const item = recruitmentByMonth.get(key) ?? { applications: 0, selected: 0, rejected: 0 }
    item.applications += 1
    const status = String(application.status ?? '').toLowerCase()
    if (status === 'selected') item.selected += 1
    if (status === 'rejected') item.rejected += 1
    recruitmentByMonth.set(key, item)
  }
  const recruitmentTrend = months.map((month) => ({ month: monthLabel(month), ...(recruitmentByMonth.get(month) ?? { applications: 0, selected: 0, rejected: 0 }) }))

  const sentimentCounts = { Positive: 0, Neutral: 0, Negative: 0 }
  const feedbackMonths = new Map()
  for (const row of feedback) {
    const sentiment = String(row.sentiment ?? '').toLowerCase()
    if (sentiment === 'positive') sentimentCounts.Positive += 1
    if (sentiment === 'neutral') sentimentCounts.Neutral += 1
    if (sentiment === 'negative') sentimentCounts.Negative += 1
    const key = monthKey(row.created_at)
    if (!key || !key.startsWith(String(year)) || row.rating == null) continue
    const item = feedbackMonths.get(key) ?? []
    item.push(Number(row.rating))
    feedbackMonths.set(key, item)
  }
  const feedbackTrend = months.map((month) => ({ month: monthLabel(month), score: average(feedbackMonths.get(month) ?? []) }))

  const activeEmployees = employees.filter((row) => String(row.status ?? 'Active').toLowerCase() === 'active').length
  const presentToday = currentAttendance.filter((row) => ['present', 'late', 'half day'].includes(String(row.status ?? '').toLowerCase())).length
  const absentToday = currentAttendance.filter((row) => String(row.status ?? '').toLowerCase() === 'absent').length
  const approvedToday = leaves.filter((row) => String(row.status ?? '').toLowerCase() === 'approved' && row.start_date <= today && row.end_date >= today).length
  const reviewRatings = reviews.filter((row) => row.rating != null).map((row) => Number(row.rating))
  const goalDone = goals.filter((row) => String(row.status ?? '').toLowerCase() === 'completed' || Number(row.progress) >= 100).length
  const averageFeedback = average(feedback.filter((row) => row.rating != null).map((row) => row.rating))
  const applicationStatuses = applications.map((row) => String(row.status ?? '').toLowerCase())
  const openStatuses = ['applied', 'shortlisted', 'interview scheduled']
  const statusCounts = new Map()
  for (const row of employees) {
    const status = row.status || 'Unspecified'
    statusCounts.set(status, (statusCounts.get(status) ?? 0) + 1)
  }

  const departments = [...departmentsByName.values()].map((item) => ({ ...item, rating: average(item.ratings) }))
    .sort((left, right) => right.employees - left.employees || left.name.localeCompare(right.name))
  const currentDepartmentAttendance = currentAttendance.length
    ? Math.round(presentToday / currentAttendance.length * 1000) / 10
    : 0

  return {
    summary: {
      employees: activeEmployees,
      newEmployees: employees.filter((row) => row.joining_date >= monthStart).length,
      openings: jobs.filter((row) => String(row.status ?? '').toLowerCase() === 'open').length,
      candidates: candidates.length,
      applications: applications.length,
      selected: applicationStatuses.filter((status) => status === 'selected').length,
      rejected: applicationStatuses.filter((status) => status === 'rejected').length,
      inReview: applicationStatuses.filter((status) => openStatuses.includes(status)).length,
      attendanceRate: currentAttendance.length ? currentDepartmentAttendance : 0,
      present: presentToday,
      absent: absentToday,
      onLeave: approvedToday,
      leavePending: leaves.filter((row) => String(row.status ?? '').toLowerCase() === 'pending').length,
      leaveApproved: leaves.filter((row) => String(row.status ?? '').toLowerCase() === 'approved' && row.start_date >= monthStart).length,
      leaveRejected: leaves.filter((row) => String(row.status ?? '').toLowerCase() === 'rejected' && row.start_date >= monthStart).length,
      averagePerformance: average(reviewRatings),
      goalCompletion: goals.length ? goalDone / goals.length * 100 : 0,
      goalsCompleted: goalDone,
      goalsInProgress: goals.filter((row) => String(row.status ?? '').toLowerCase() === 'in_progress').length,
      goalsNotStarted: goals.filter((row) => !['completed', 'in_progress'].includes(String(row.status ?? '').toLowerCase()) && Number(row.progress) < 100).length,
      goalTotal: goals.length,
      averageFeedback,
      positiveFeedback: sentimentCounts.Positive,
      neutralFeedback: sentimentCounts.Neutral,
      negativeFeedback: sentimentCounts.Negative,
      feedbackResponses: feedback.length,
      totalExits: exits.filter((row) => String(row.status ?? '').toLowerCase() !== 'cancelled').length,
    },
    departments,
    workforceMix: [...statusCounts].map(([name, value]) => ({ name, value })),
    monthlyAttendance,
    recruitmentTrend,
    feedbackSentiment: Object.entries(sentimentCounts).map(([name, value]) => ({ name, value })),
    feedbackTrend,
    exitReasons: [...new Set(exits.map((row) => row.reason).filter(Boolean))].map((name) => ({ name, count: exits.filter((row) => row.reason === name && String(row.status ?? '').toLowerCase() !== 'cancelled').length })),
    reportingPeriod: {
      asOf: now.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }),
      attendanceWindow: `Recorded attendance in ${year}`,
    },
  }
}

export function useLiveAnalytics() {
  const [state, setState] = useState({ data: null, status: 'loading', error: '' })

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setState({ data: demoData, status: 'demo', error: 'Supabase is not configured. Showing labeled demonstration data.' })
      return undefined
    }
    let active = true
    async function load() {
      const start = new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10)
      const results = await Promise.all([
        supabase.from('employees').select('id,department,status,joining_date'),
        supabase.from('attendance').select('employee_id,attendance_date,status').gte('attendance_date', start),
        supabase.from('leaves').select('employee_id,start_date,end_date,status'),
        supabase.from('jobs').select('id,status'),
        supabase.from('candidates').select('id'),
        supabase.from('applications').select('applied_date,status'),
        supabase.from('performance_reviews').select('employee_id,rating,created_at'),
        supabase.from('employee_goals').select('employee_id,progress,status'),
        supabase.from('feedback').select('rating,sentiment,created_at').not('rating', 'is', null),
        supabase.from('exit_records').select('employee_id,reason,status'),
      ])
      const labels = ['employees', 'attendance', 'leaves', 'jobs', 'candidates', 'applications', 'performance reviews', 'employee goals', 'feedback', 'exit records']
      const failed = results.find((result) => result.error)
      if (failed) {
        const index = results.indexOf(failed)
        throw new Error(`Could not load ${labels[index]}: ${failed.error.message}`)
      }
      const data = buildLiveData({
        employees: results[0].data ?? [],
        attendance: results[1].data ?? [],
        leaves: results[2].data ?? [],
        jobs: results[3].data ?? [],
        candidates: results[4].data ?? [],
        applications: results[5].data ?? [],
        reviews: results[6].data ?? [],
        goals: results[7].data ?? [],
        feedback: results[8].data ?? [],
        exits: results[9].data ?? [],
      })
      if (active) setState({ data, status: 'live', error: '' })
    }
    load().catch((issue) => {
      if (active) setState({ data: demoData, status: 'demo', error: `${issue.message} Showing demonstration data.` })
    })
    return () => { active = false }
  }, [])

  return state
}
