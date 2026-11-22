import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { postAiRequest } from '../services/aiApi.js'

const base = { employee_count: 10, pending_tasks: 100, weekly_hours_per_employee: 40, overtime_hours: 20, average_task_hours: 4, trained_employee_count: 4 }
const initialChanges = { hire_employees: 2, reassigned_tasks: 0, weekly_hours_change: 0, additional_trained_employees: 0 }
const scenarioFields = {
  hiring: ['hire_employees'],
  redistribution: ['reassigned_tasks'],
  hours: ['weekly_hours_change'],
  training: ['additional_trained_employees'],
  combined: Object.keys(initialChanges),
}
const fields = [
  ['employee_count', 'Current employees', 'current', 1], ['pending_tasks', 'Pending tasks', 'current', 0], ['weekly_hours_per_employee', 'Weekly hours per employee', 'current', 1], ['overtime_hours', 'Team overtime hours', 'current', 0], ['average_task_hours', 'Average hours per task', 'current', 1], ['trained_employee_count', 'Already trained employees', 'current', 0],
  ['hire_employees', 'Additional hires', 'changes', 0], ['reassigned_tasks', 'Tasks reassigned out', 'changes', 0], ['weekly_hours_change', 'Weekly hours change per person', 'changes', -1], ['additional_trained_employees', 'Additional employees trained', 'changes', 0],
]

export default function SimulatorPage() {
  const [current, setCurrent] = useState(base)
  const [changes, setChanges] = useState(initialChanges)
  const [scenario, setScenario] = useState('hiring')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  function update(section, key, value) {
    const number = Number(value)
    if (section === 'current') setCurrent((old) => ({ ...old, [key]: number }))
    else setChanges((old) => ({ ...old, [key]: number }))
  }

  async function runSimulation(event) {
    event.preventDefault(); setBusy(true); setError(''); setResult(null)
    try { setResult(await postAiRequest('simulator', { current, changes })) }
    catch (issue) { setError(issue.message) }
    finally { setBusy(false) }
  }

  return <section className="simulator-page">
    <p className="eyebrow">WORKFORCE PLANNING</p><h1>What-if simulator</h1>
    <p className="muted">Adjust a baseline, choose a change, and compare transparent planning estimates.</p>
    <form className="panel simulator-form" onSubmit={runSimulation}>
      <div className="sim-fields"><div><h2>Current situation</h2><p>Baseline team and work values</p></div>{fields.filter(([, , section]) => section === 'current').map(([key, label, section, min]) => <label key={key}>{label}<input type="number" min={min} step={key.includes('hours') ? '0.5' : '1'} required value={current[key]} onChange={(e) => update(section, key, e.target.value)} /></label>)}</div>
      <div className="sim-fields"><div><h2>Hypothetical changes</h2><p>Select the change to compare</p></div><label>Scenario<select value={scenario} onChange={(e) => { const nextScenario = e.target.value; setScenario(nextScenario); setChanges({ ...initialChanges, hire_employees: 0, [scenarioFields[nextScenario][0]]: nextScenario === 'hiring' ? 2 : nextScenario === 'redistribution' ? 10 : nextScenario === 'hours' ? -2 : nextScenario === 'training' ? 2 : 0 }) }}><option value="hiring">Hire additional employees</option><option value="redistribution">Redistribute workload</option><option value="hours">Change working hours</option><option value="training">Provide additional training</option><option value="combined">Combine changes</option></select></label>{fields.filter(([key, , section]) => section === 'changes' && scenarioFields[scenario].includes(key)).map(([key, label, section, min]) => <label key={key}>{label}<input type="number" min={key === 'weekly_hours_change' ? -40 : min} step={key === 'weekly_hours_change' ? '0.5' : '1'} required value={changes[key]} onChange={(e) => update(section, key, e.target.value)} /></label>)}</div>
      <button className="primary-button" disabled={busy}>{busy ? 'Calculating…' : 'Run simulation'}</button>
      {error && <p className="api-error" role="alert">{error}</p>}
    </form>
    {result && <div className="simulation-results"><div className="result-heading"><div><h2>{result.scenario_name}</h2><p>{result.summary}</p></div></div><div className="comparison-grid">{result.comparison.map((metric) => <article className="comparison-card" key={metric.metric}><span>{metric.label}</span><div><strong>{metric.current}</strong><i>→</i><strong>{metric.simulated}</strong></div><small className={metric.improved ? 'positive' : ''}>{metric.change > 0 ? '+' : ''}{metric.change} · {metric.direction}</small></article>)}</div><div className="comparison-charts"><article className="panel"><h2>Tasks per employee</h2><ResponsiveContainer width="100%" height={220}><BarChart data={[{ period: 'Current', value: result.current.tasks_per_employee }, { period: 'Simulated', value: result.simulated.tasks_per_employee }]} margin={{ top: 12, right: 12, left: -18, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="period" /><YAxis /><Tooltip /><Bar dataKey="value" name="Tasks per employee" fill="#4d86e8" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer></article><article className="panel"><h2>Workload ratio</h2><ResponsiveContainer width="100%" height={220}><BarChart data={[{ period: 'Current', value: result.current.workload_ratio }, { period: 'Simulated', value: result.simulated.workload_ratio }]} margin={{ top: 12, right: 12, left: -18, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="period" /><YAxis /><Tooltip /><Bar dataKey="value" name="Workload ratio" fill="#63b99a" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer></article></div><div className="panel assumptions"><strong>Calculation assumptions</strong><ul>{result.assumptions.map((assumption) => <li key={assumption}>{assumption}</li>)}</ul><p>{result.disclaimer}</p></div></div>}
  </section>
}
