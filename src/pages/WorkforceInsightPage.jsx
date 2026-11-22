import { useState } from 'react'
import { postAiRequest } from '../services/aiApi.js'

const journeyExample = {
  employees: [{
    employee_id: 'EMP001', full_name: 'Asha Rao', department: 'Engineering',
    attendance: { total_days: 20, present_days: 14, absent_days: 4, late_days: 2, half_days: 0 },
    leave: { pending_requests: 1, approved_days_last_90: 6 },
    onboarding: { total_tasks: 5, completed_tasks: 2 }, performance_ratings: [4, 2.5],
    goals: { total_goals: 3, completed_goals: 0, average_progress: 25 },
    feedback: { average_score: 2.2, response_count: 4 }, grievances: { open_count: 1 },
  }],
}

const workloadExample = {
  period_days: 30,
  departments: [{ department: 'Engineering', employees: [
    { employee_id: 'EMP001', full_name: 'Asha Rao', overtime_hours: 28, pending_tasks: 18, deadline_extensions: 4, total_days: 20, absent_days: 4, workload_complaints: 2, feedback_score: 2.4 },
    { employee_id: 'EMP002', full_name: 'Rohan Mehta', overtime_hours: 4, pending_tasks: 3, deadline_extensions: 0, total_days: 20, absent_days: 0, workload_complaints: 0, feedback_score: 4.3 },
  ] }],
}

export default function WorkforceInsightPage({ feature }) {
  const isJourney = feature === 'journey'
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function runAnalysis() {
    setBusy(true); setError(''); setResult(null)
    try { setResult(await postAiRequest(isJourney ? 'journey' : 'workload', isJourney ? journeyExample : workloadExample)) }
    catch (issue) { setError(issue.message) }
    finally { setBusy(false) }
  }

  const groups = isJourney ? (result?.results ?? []) : (result?.departments ?? [])
  return <section className="ai-page">
    <p className="eyebrow">WORKFORCE INTELLIGENCE</p>
    <h1>{isJourney ? 'Employee journey indicators' : 'Workload friction'}</h1>
    <p className="muted">{isJourney ? 'Review explainable work-record signals and possible support actions.' : 'Explore potential workload imbalance by department and employee.'}</p>
    <div className="ai-demo-note"><strong>Sample analysis</strong><span>This first integration uses synthetic examples. It does not predict behaviour or resignation.</span></div>
    <button className="primary-button" onClick={runAnalysis} disabled={busy}>{busy ? 'Analysing…' : 'Run analysis'}</button>
    {error && <p className="api-error" role="alert">{error}</p>}
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
