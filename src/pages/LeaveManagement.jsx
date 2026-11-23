import { useEffect, useState } from 'react'
import { supabase } from '../utils/supabaseClient'

const card = 'rounded-2xl border border-slate-200 bg-white p-5'
const field = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100'
const dateText = (d) => d ? new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

export default function LeaveManagement() {
  const [employees, setEmployees] = useState([])
  const [requests, setRequests] = useState([])
  const [balances, setBalances] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [filter, setFilter] = useState('All')
  const [form, setForm] = useState({ employee_id: '', leave_type: 'Casual', start_date: '', end_date: '', reason: '' })

  async function load() {
    setLoading(true)
    const [e, l, b] = await Promise.all([
      supabase.from('employees').select('id,emp_id,full_name').order('full_name'),
      supabase.from('leaves').select('*,employees!leaves_employee_id_fkey(full_name,emp_id)').order('created_at', { ascending: false }),
      supabase.from('leave_balances').select('*,employees!leave_balances_employee_id_fkey(full_name,emp_id)').order('leave_type'),
    ])
    const issue = e.error || l.error || b.error
    if (issue) setError(issue.message)
    else { setError(''); setEmployees(e.data || []); setRequests(l.data || []); setBalances(b.data || []) }
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function addRequest(ev) {
    ev.preventDefault()
    if (form.end_date < form.start_date) { setMessage('End date must be on or after start date.'); return }
    const { error: saveError } = await supabase.from('leaves').insert({ ...form, reason: form.reason.trim() })
    if (saveError) { setMessage('Could not add request: ' + saveError.message); return }
    setForm({ employee_id: '', leave_type: 'Casual', start_date: '', end_date: '', reason: '' })
    setMessage('Leave request added.')
    await load()
  }
  async function review(row, status) {
    const { error: updateError } = await supabase.from('leaves').update({ status, reviewed_at: new Date().toISOString() }).eq('id', row.id)
    if (updateError) setMessage('Could not update request: ' + updateError.message)
    else { setMessage('Request ' + status.toLowerCase() + '.'); await load() }
  }

  const shown = requests.filter((r) => filter === 'All' || r.status === filter)
  return <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-8">
    <div><p className="eyebrow">PEOPLE OPERATIONS</p><h1 className="mt-2 text-3xl font-semibold text-slate-900">Leave management</h1><p className="mt-1 text-sm text-slate-500">Review leave requests and view employee leave balances.</p></div>
    {error && <p role="alert" className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}
    {message && <p role="status" className="text-sm text-violet-700">{message}</p>}
    <div className="grid gap-4 sm:grid-cols-3">{[['Requests',requests.length],['Pending',requests.filter((r)=>r.status==='Pending').length],['Employees',employees.length]].map(([label,n])=><div className={card} key={label}><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-3xl font-semibold text-slate-900">{loading?'—':n}</p></div>)}</div>
    <section className={card}><h2 className="text-lg font-semibold">Record a leave request</h2><form onSubmit={addRequest} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <select className={field} required value={form.employee_id} onChange={(e)=>setForm({...form,employee_id:e.target.value})}><option value="">Select employee</option>{employees.map((e)=><option key={e.id} value={e.id}>{e.full_name} · {e.emp_id}</option>)}</select>
      <select className={field} value={form.leave_type} onChange={(e)=>setForm({...form,leave_type:e.target.value})}>{['Casual','Sick','Earned'].map((x)=><option key={x}>{x}</option>)}</select>
      <input className={field} type="date" required aria-label="Start date" value={form.start_date} onChange={(e)=>setForm({...form,start_date:e.target.value})}/>
      <input className={field} type="date" required aria-label="End date" value={form.end_date} onChange={(e)=>setForm({...form,end_date:e.target.value})}/>
      <button className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700">Add request</button>
      <input className={field+' sm:col-span-2 lg:col-span-5'} required placeholder="Reason" value={form.reason} onChange={(e)=>setForm({...form,reason:e.target.value})}/>
    </form></section>
    <section className={card}><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">Leave requests</h2><p className="text-sm text-slate-500">Approve or reject pending requests.</p></div><select className={field+' w-auto'} value={filter} onChange={(e)=>setFilter(e.target.value)}>{['All','Pending','Approved','Rejected'].map((x)=><option key={x}>{x}</option>)}</select></div>
      <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="border-b text-slate-500"><tr>{['Employee','Type','Dates','Reason','Status','Review'].map((x)=><th key={x} className="px-3 py-3 font-medium">{x}</th>)}</tr></thead><tbody className="divide-y">{shown.map((r)=><tr key={r.id}><td className="px-3 py-3 font-medium">{r.employees?.full_name}<span className="block text-xs text-slate-500">{r.employees?.emp_id}</span></td><td className="px-3 py-3">{r.leave_type}</td><td className="px-3 py-3">{dateText(r.start_date)} – {dateText(r.end_date)}</td><td className="px-3 py-3">{r.reason}</td><td className="px-3 py-3">{r.status}</td><td className="px-3 py-3">{r.status==='Pending'?<div className="flex gap-2"><button onClick={()=>review(r,'Approved')} className="text-emerald-700">Approve</button><button onClick={()=>review(r,'Rejected')} className="text-rose-700">Reject</button></div>:'—'}</td></tr>)}</tbody></table>{!loading&&shown.length===0&&<p className="py-8 text-center text-sm text-slate-500">No matching requests.</p>}</div>
    </section>
    <section className={card}><h2 className="text-lg font-semibold">Leave balances</h2><div className="mt-3 overflow-x-auto"><table className="w-full min-w-[500px] text-left text-sm"><thead className="border-b text-slate-500"><tr>{['Employee','Type','Year','Available','Used'].map((x)=><th key={x} className="px-3 py-3 font-medium">{x}</th>)}</tr></thead><tbody className="divide-y">{balances.map((b)=><tr key={b.id}><td className="px-3 py-3">{b.employees?.full_name} · {b.employees?.emp_id}</td><td className="px-3 py-3">{b.leave_type}</td><td className="px-3 py-3">{b.leave_year}</td><td className="px-3 py-3">{Math.max(0,b.total_days-b.used_days)}</td><td className="px-3 py-3">{b.used_days}/{b.total_days}</td></tr>)}</tbody></table>{!loading&&balances.length===0&&<p className="py-6 text-center text-sm text-slate-500">No balances recorded.</p>}</div></section>
  </div>
}
