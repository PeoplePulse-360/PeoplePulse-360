import { useState } from 'react'
import { isSupabaseConfigured, supabase } from '../lib/supabase.js'
import { postAiRequest } from '../services/aiApi.js'

const DAY_MS = 24 * 60 * 60 * 1000

function unwrap(result, label) {
  if (result.error) throw new Error(`Could not load ${label}: ${result.error.message}`)
  return result.data ?? []
}

function dateWindow(days) {
  const end = new Date()
  const start = new Date(end.getTime() - days * DAY_MS)
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) }
}

function countInclusiveDays(start, end, windowStart, windowEnd) {
  const first = Math.max(Date.parse(`${start}T00:00:00Z`), Date.parse(`${windowStart}T00:00:00Z`))
  const last = Math.min(Date.parse(`${end}T00:00:00Z`), Date.parse(`${windowEnd}T00:00:00Z`))
  return last < first ? 0 : Math.floor((last - first) / DAY_MS) + 1
}

async function buildJourneyRequest() {
  if (!isSupabaseConfigured || !supabase) throw new Error('Supabase is not configured for this deployment.')

  const attendanceWindow = dateWindow(30)
  const leaveWindow = dateWindow(90)
  const [employeesResult, attendanceResult, leavesResult, onboardingResult, reviewsResult, goalsResult, responsesResult, feedbackResult, grievancesResult] = await Promise.all([
    supabase.from('employees').select('id,emp_id,full_name,department').order('emp_id'),
    supabase.from('attendance').select('employee_id,status,attendance_date').gte('attendance_date', attendanceWindow.start).lte('attendance_date', attendanceWindow.end),
    supabase.from('leaves').select('employee_id,status,start_date,end_date').gte('end_date', leaveWindow.start).lte('start_date', leaveWindow.end),
    supabase.from('onboarding_tasks').select('employee_id,status'),
    supabase.from('performance_reviews').select('employee_id,rating,created_at').not('rating', 'is', null).order('created_at', { ascending: true }),
    supabase.from('employee_goals').select('employee_id,progress,status'),
    supabase.from('feedback_responses').select('employee_id,avg_rating').not('employee_id', 'is', null),
    supabase.from('feedback').select('employee_id,rating').not('employee_id', 'is', null).not('rating', 'is', null),
    supabase.from('grievances').select('employee_id,status').not('employee_id', 'is', null),
  ])

  const employees = unwrap(employeesResult, 'employees')
  const attendance = unwrap(attendanceResult, 'attendance')
  const leaves = unwrap(leavesResult, 'leave requests')
  const onboarding = unwrap(onboardingResult, 'onboarding tasks')
  const reviews = unwrap(reviewsResult, 'performance reviews')
  const goals = unwrap(goalsResult, 'employee goals')
  const responses = unwrap(responsesResult, 'feedback responses')
  const feedback = unwrap(feedbackResult, 'feedback')
  const grievances = unwrap(grievancesResult, 'grievances')

  if (!employees.length) throw new Error('There are no employee records to analyze.')

  return {
    employees: employees.map((employee) => {
      const id = employee.id
      const employeeAttendance = attendance.filter((row) => row.employee_id === id)
      const employeeLeaves = leaves.filter((row) => row.employee_id === id)
      const employeeOnboarding = onboarding.filter((row) => row.employee_id === id)
      const employeeReviews = reviews.filter((row) => row.employee_id === id)
      const employeeGoals = goals.filter((row) => row.employee_id === id)
      const employeeResponses = responses.filter((row) => row.employee_id === id && row.avg_rating != null && Number.isFinite(Number(row.avg_rating)))
      const employeeFeedback = feedback.filter((row) => row.employee_id === id && row.rating != null && Number.isFinite(Number(row.rating)))
      const chosenFeedback = employeeResponses.length ? employeeResponses.map((row) => Number(row.avg_rating)) : employeeFeedback.map((row) => Number(row.rating))
      const openGrievances = grievances.filter((row) => row.employee_id === id && ['open', 'submitted', 'under review', 'in_review', 'in progress', 'in_progress'].includes(String(row.status ?? '').toLowerCase())).length
      const approvedDays = employeeLeaves
        .filter((row) => String(row.status ?? '').toLowerCase() === 'approved' && row.start_date && row.end_date)
        .reduce((sum, row) => sum + countInclusiveDays(row.start_date, row.end_date, leaveWindow.start, leaveWindow.end), 0)
      const empId = employee.emp_id
      if (!empId) throw new Error(`Employee ${employee.full_name ?? ''} is missing the shared employee code.`)

      const result = {
        employee_id: empId,
        full_name: employee.full_name || empId,
        department: employee.department || 'Unassigned',
      }

      if (employeeAttendance.length) {
        const countStatus = (status) => employeeAttendance.filter((row) => String(row.status ?? '').toLowerCase() === status.toLowerCase()).length
        result.attendance = {
          total_days: employeeAttendance.length,
          present_days: countStatus('Present'),
          absent_days: countStatus('Absent'),
          late_days: countStatus('Late'),
          half_days: countStatus('Half Day'),
        }
      }
      if (employeeLeaves.length) {
        result.leave = {
          pending_requests: employeeLeaves.filter((row) => String(row.status ?? '').toLowerCase() === 'pending').length,
          approved_days_last_90: approvedDays,
        }
      }
      if (employeeOnboarding.length) {
        result.onboarding = {
          total_tasks: employeeOnboarding.length,
          completed_tasks: employeeOnboarding.filter((row) => String(row.status ?? '').toLowerCase() === 'completed').length,
        }
      }
      if (employeeReviews.length) result.performance_ratings = employeeReviews.map((row) => Number(row.rating))
      if (employeeGoals.length) {
        result.goals = {
          total_goals: employeeGoals.length,
          completed_goals: employeeGoals.filter((row) => String(row.status ?? '').toLowerCase() === 'completed' || Number(row.progress) >= 100).length,
          average_progress: Math.round(employeeGoals.reduce((sum, row) => sum + (Number(row.progress) || 0), 0) / employeeGoals.length),
        }
      }
      if (chosenFeedback.length) {
        result.feedback = {
          average_score: chosenFeedback.reduce((sum, score) => sum + score, 0) / chosenFeedback.length,
          response_count: chosenFeedback.length,
        }
      }
      if (openGrievances) result.grievances = { open_count: openGrievances }
      return result
    }),
  }
}

async function buildWorkloadRequest() {
  if (!isSupabaseConfigured || !supabase) throw new Error('Supabase is not configured for this deployment.')
  const window = dateWindow(30)
  const [employeesResult, attendanceResult] = await Promise.all([
    supabase.from('employees').select('id,emp_id,full_name,department').order('emp_id'),
    supabase.from('attendance').select('employee_id,status,attendance_date').gte('attendance_date', window.start).lte('attendance_date', window.end),
  ])
  const employees = unwrap(employeesResult, 'employees')
  const attendance = unwrap(attendanceResult, 'attendance')
  if (!employees.length) throw new Error('There are no employee records to analyze.')

  const departments = new Map()
  for (const employee of employees) {
    if (!employee.emp_id) throw new Error(`Employee ${employee.full_name ?? ''} is missing the shared employee code.`)
    const department = employee.department || 'Unassigned'
    const rows = attendance.filter((row) => row.employee_id === employee.id)
    const group = departments.get(department) ?? []
    group.push({
      employee_id: employee.emp_id,
      full_name: employee.full_name || employee.emp_id,
      total_days: rows.length,
      absent_days: rows.filter((row) => String(row.status ?? '').toLowerCase() === 'absent').length,
    })
    departments.set(department, group)
  }

  return {
    period_days: 30,
    departments: [...departments].map(([department, people]) => ({ department, employees: people })),
  }
}

export default function WorkforceInsightPage({ feature }) {
  const isJourney = feature === 'journey'
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function runAnalysis() {
    setBusy(true)
    setError('')
    setResult(null)
    try {
      const payload = isJourney ? await buildJourneyRequest() : await buildWorkloadRequest()
      setResult(await postAiRequest(isJourney ? 'journey' : 'workload', payload))
    } catch (issue) {
      setError(issue.message || 'The analysis could not be completed.')
    } finally {
      setBusy(false)
    }
  }

  const groups = isJourney ? (result?.results ?? []) : (result?.departments ?? [])
  const sourceNote = isJourney
    ? 'Uses available Supabase records from the last 30 days for attendance and 90 days for leave. Missing sections are omitted.'
    : 'Uses live attendance records for the last 30 days. Overtime, tasks, deadline changes, and workload complaints are omitted because no shared source is defined for them.'

  return <section className="ai-page">
    <p className="eyebrow">WORKFORCE INTELLIGENCE</p>
    <h1>{isJourney ? 'Employee journey indicators' : 'Workload friction'}</h1>
    <p className="muted">{isJourney ? 'Review explainable work-record signals and possible support actions.' : 'Explore potential workload imbalance by department and employee.'}</p>
    <div className="ai-demo-note"><strong>Live HR data</strong><span>{sourceNote} Results are indicators for HR review, not predictions of behaviour or resignation.</span></div>
    <button className="primary-button" onClick={runAnalysis} disabled={busy}>{busy ? 'Analysing…' : 'Run analysis'}</button>
    {error && <p className="api-error" role="alert">{error}</p>}
    {result && groups.length === 0 && <p className="muted">No records were returned for this analysis.</p>}
    {groups.map((item) => <article className="ai-result-card" key={item.employee_id ?? item.department}>
      <div className="result-heading"><div><h2>{item.full_name ?? item.department}</h2><p>{item.department ?? `${item.flagged_employee_count} employee(s) may need review`}</p></div><span className={`attention-badge ${item.attention_level}`}>{item.attention_level} attention</span></div>
      <p className="result-summary">{item.summary}</p>
      {!!item.indicators?.length && <div className="result-list"><strong>Indicators</strong>{item.indicators.map((indicator, index) => <p key={`${indicator.area}-${index}`}><b>{indicator.area}:</b> {indicator.reason}</p>)}</div>}
      {!!item.recommendations?.length && <div className="result-list recommendations"><strong>Possible next steps</strong>{item.recommendations.map((recommendation) => <p key={recommendation}>• {recommendation}</p>)}</div>}
      {item.employees?.length > 0 && <div className="result-list"><strong>Employee signals</strong>{item.employees.map((employee) => <p key={employee.employee_id}>{employee.full_name} · {employee.attention_level} attention · score {employee.indicator_score}/100</p>)}</div>}
    </article>)}
    {result?.disclaimer && <p className="ai-disclaimer">{result.disclaimer}</p>}
  </section>
}
