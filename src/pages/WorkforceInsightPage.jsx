import { useState } from 'react'
import { supabase } from '../utils/supabaseClient.js'
import { postAiRequest } from '../services/aiApi.js'

const workloadExample = {
  period_days: 30,
  departments: [{ department: 'Engineering', employees: [
    { employee_id: 'EMP001', full_name: 'Asha Rao', overtime_hours: 28, pending_tasks: 18, deadline_extensions: 4, total_days: 20, absent_days: 4, workload_complaints: 2, feedback_score: 2.4 },
    { employee_id: 'EMP002', full_name: 'Rohan Mehta', overtime_hours: 4, pending_tasks: 3, deadline_extensions: 0, total_days: 20, absent_days: 0, workload_complaints: 0, feedback_score: 4.3 },
  ] }],
}

const dateOnly = (date) => date.toISOString().slice(0, 10)
function employeeCode(value) {
  const digits = String(value || '').replace(/\D/g, '')
  return digits ? 'EMP' + digits.padStart(3, '0') : String(value || '')
}
function sumDaysInRange(start, end, rangeStart, rangeEnd) {
  const first = new Date(Math.max(new Date(start + 'T00:00:00').getTime(), new Date(rangeStart + 'T00:00:00').getTime()))
  const last = new Date(Math.min(new Date(end + 'T00:00:00').getTime(), new Date(rangeEnd + 'T00:00:00').getTime()))
  return first > last ? 0 : Math.floor((last - first) / 86400000) + 1
}

async function buildJourneyRequest() {
  if (!supabase) throw new Error('Supabase is not configured for this deployment.')
  const end = new Date()
  const start = new Date(end)
  start.setDate(start.getDate() - 89)
  const startDate = dateOnly(start)
  const endDate = dateOnly(end)
  const [employees, attendance, leaves, onboarding, reviews, feedback, grievances] = await Promise.all([
    supabase.from('employees').select('id,emp_id,full_name,department').order('emp_id'),
    supabase.from('attendance').select('employee_id,attendance_date,status').gte('attendance_date', startDate).lte('attendance_date', endDate),
    supabase.from('leaves').select('employee_id,status,start_date,end_date'),
    supabase.from('onboarding_tasks').select('employee_id,status'),
    supabase.from('performance_reviews').select('employee_id,rating,created_at').order('created_at'),
    supabase.from('feedback').select('employee_id,rating'),
    supabase.from('grievances').select('employee_id,status'),
  ])
  const issue = [employees, attendance, leaves, onboarding, reviews, feedback, grievances].find((result) => result.error)
  if (issue) throw new Error('Could not read HR data: ' + issue.error.message)
  if (!employees.data?.length) throw new Error('No employee records are visible to your account yet.')

  const group = (rows = []) => rows.reduce((map, row) => {
    if (row.employee_id) map.set(row.employee_id, [...(map.get(row.employee_id) || []), row])
    return map
  }, new Map())
  const byAttendance = group(attendance.data)
  const byLeave = group(leaves.data)
  const byOnboarding = group(onboarding.data)
  const byReview = group(reviews.data)
  const byFeedback = group(feedback.data)
  const byGrievance = group(grievances.data)

  return {
    employees: employees.data.map((employee) => {
      const records = (map) => map.get(employee.id) || []
      const a = records(byAttendance)
      const l = records(byLeave)
      const o = records(byOnboarding)
      const r = records(byReview).filter((row) => row.rating !== null && row.rating !== undefined)
      const f = records(byFeedback).map((row) => Number(row.rating)).filter((rating) => Number.isFinite(rating))
      const g = records(byGrievance)
      const item = {
        employee_id: employeeCode(employee.emp_id),
        full_name: employee.full_name,
        department: employee.department || 'Unassigned',
        performance_ratings: r.map((row) => Number(row.rating)),
      }
      if (a.length) item.attendance = {
        total_days: a.length,
        present_days: a.filter((row) => row.status === 'Present').length,
        absent_days: a.filter((row) => row.status === 'Absent').length,
        late_days: a.filter((row) => row.status === 'Late').length,
        half_days: a.filter((row) => row.status === 'Half Day').length,
      }
      if (l.length) item.leave = {
        pending_requests: l.filter((row) => row.status === 'Pending').length,
        approved_days_last_90: l.filter((row) => row.status === 'Approved' && row.start_date && row.end_date)
          .reduce((total, row) => total + sumDaysInRange(row.start_date, row.end_date, startDate, endDate), 0),
      }
      if (o.length) item.onboarding = {
        total_tasks: o.length,
        completed_tasks: o.filter((row) => row.status === 'Completed').length,
      }
      if (f.length) item.feedback = {
        average_score: Number((f.reduce((total, rating) => total + rating, 0) / f.length).toFixed(2)),
        response_count: f.length,
      }
      if (g.length) item.grievances = {
        open_count: g.filter((row) => !['resolved', 'rejected', 'closed'].includes(String(row.status || '').toLowerCase())).length,
      }
      return item
    }),
  }
}

export default function WorkforceInsightPage({ feature }) {
  const isJourney = feature === 'journey'
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [source, setSource] = useState('')

  async function runAnalysis() {
    setBusy(true); setError(''); setResult(null)
    try {
      if (isJourney) {
        const payload = await buildJourneyRequest()
        const analysis = await postAiRequest('journey', payload)
        setResult(analysis)
        setSource('Live, HR-visible records from Supabase. Missing sections are omitted when no records exist.')
      } else {
        setResult(await postAiRequest('workload', workloadExample))
        setSource('Synthetic demonstration data. The shared database does not yet define overtime, pending-task, or deadline-extension fields.')
      }
    } catch (issue) { setError(issue.message) }
    finally { setBusy(false) }
  }

  const groups = isJourney ? (result?.results ?? []) : (result?.departments ?? [])
  return <section className="ai-page">
    <p className="eyebrow">WORKFORCE INTELLIGENCE</p>
    <h1>{isJourney ? 'Employee journey indicators' : 'Workload friction'}</h1>
    <p className="muted">{isJourney ? 'Review explainable work-record signals and possible support actions.' : 'Explore potential workload imbalance by department and employee.'}</p>
    <div className="ai-demo-note"><strong>{isJourney ? 'Supabase data' : 'Sample analysis'}</strong><span>{source || (isJourney ? 'Analyses HR-visible employee records without using salary, contact details or other unnecessary personal data.' : 'Workload values are synthetic until the team agrees on their shared data fields.')}</span></div>
    <button className="primary-button" onClick={runAnalysis} disabled={busy}>{busy ? 'Analysing…' : 'Run analysis'}</button>
    {error && <p className="api-error" role="alert">{error}</p>}
    {groups.map((item) => <article className="ai-result-card" key={item.employee_id ?? item.department}>
      <div className="result-heading"><div><h2>{item.full_name ?? item.department}</h2><p>{item.department ?? item.flagged_employee_count + ' employee(s) may need review'}</p></div><span className={'attention-badge ' + item.attention_level}>{item.attention_level} attention</span></div>
      <p className="result-summary">{item.summary}</p>
      {!!item.indicators?.length && <div className="result-list"><strong>Indicators</strong>{item.indicators.map((indicator, index) => <p key={indicator.area + '-' + index}><b>{indicator.area}:</b> {indicator.reason}</p>)}</div>}
      {!!item.recommendations?.length && <div className="result-list recommendations"><strong>Possible next steps</strong>{item.recommendations.map((recommendation) => <p key={recommendation}>• {recommendation}</p>)}</div>}
      {item.employees?.length > 0 && <div className="result-list"><strong>Employee signals</strong>{item.employees.map((employee) => <p key={employee.employee_id}>{employee.full_name} · {employee.attention_level} attention · score {employee.indicator_score}/100</p>)}</div>}
    </article>)}
    {result?.disclaimer && <p className="ai-disclaimer">{result.disclaimer}</p>}
  </section>
}
