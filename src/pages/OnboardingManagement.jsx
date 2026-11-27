import { useEffect, useState } from 'react'
import { supabase } from '../utils/supabaseClient'

const card = 'rounded-2xl border border-slate-200 bg-white p-5'
const field = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[var(--primary,#A29BEA)] focus:ring-2 focus:ring-[var(--primary-light,#F0EEFC)]'
const statuses = ['Pending','In Progress','Completed']

export default function OnboardingManagement() {
  const [employees,setEmployees] = useState([])
  const [tasks,setTasks] = useState([])
  const [loading,setLoading] = useState(true)
  const [error,setError] = useState('')
  const [message,setMessage] = useState('')
  const [filter,setFilter] = useState('All')
  const [form,setForm] = useState({employee_id:'',task_title:'',description:'',due_date:''})

  async function load() {
    setLoading(true)
    const [e,t] = await Promise.all([
      supabase.from('employees').select('id,emp_id,full_name').order('full_name'),
      supabase.from('onboarding_tasks').select('*,employees!onboarding_tasks_employee_id_fkey(full_name,emp_id)').order('created_at',{ascending:false}),
    ])
    const issue=e.error||t.error
    if(issue)setError(issue.message)
    else{setError('');setEmployees(e.data||[]);setTasks(t.data||[])}
    setLoading(false)
  }
  useEffect(()=>{load()},[])
  async function addTask(ev){
    ev.preventDefault()
    const payload={...form,task_title:form.task_title.trim(),description:form.description.trim()||null,due_date:form.due_date||null}
    const {error:saveError}=await supabase.from('onboarding_tasks').insert(payload)
    if(saveError){setMessage('Could not add task: '+saveError.message);return}
    setForm({employee_id:'',task_title:'',description:'',due_date:''});setMessage('Task added.');await load()
  }
  async function changeStatus(task,status){
    const {error:updateError}=await supabase.from('onboarding_tasks').update({status,completed_at:status==='Completed'?new Date().toISOString():null}).eq('id',task.id)
    if(updateError)setMessage('Could not update task: '+updateError.message)
    else{setMessage('Task updated.');await load()}
  }
  const completed=tasks.filter((t)=>t.status==='Completed').length
  const shown=tasks.filter((t)=>filter==='All'||t.employee_id===filter)
  return <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-8">
    <div><p className="eyebrow">PEOPLE OPERATIONS</p><h1 className="mt-2 text-3xl font-semibold text-slate-900">Onboarding</h1><p className="mt-1 text-sm text-slate-500">Assign and track tasks for new employees.</p></div>
    {error&&<p role="alert" className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}{message&&<p role="status" className="text-sm text-[var(--primary-hover,#8F87DC)]">{message}</p>}
    <div className="grid gap-4 sm:grid-cols-3">{[['Tasks',tasks.length],['Completed',completed],['Progress',tasks.length?Math.round(completed/tasks.length*100)+'%':'0%']].map(([label,n])=><div className={card} key={label}><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-3xl font-semibold">{loading?'—':n}</p></div>)}</div>
    <section className={card}><h2 className="text-lg font-semibold">Create onboarding task</h2><form onSubmit={addTask} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <select className={field} required value={form.employee_id} onChange={(e)=>setForm({...form,employee_id:e.target.value})}><option value="">Select employee</option>{employees.map((e)=><option key={e.id} value={e.id}>{e.full_name} · {e.emp_id}</option>)}</select>
      <input className={field} required placeholder="Task title" value={form.task_title} onChange={(e)=>setForm({...form,task_title:e.target.value})}/>
      <input className={field} type="date" aria-label="Due date" value={form.due_date} onChange={(e)=>setForm({...form,due_date:e.target.value})}/>
      <button className="rounded-xl bg-[var(--primary,#A29BEA)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--primary-hover,#8F87DC)]">Add task</button>
      <textarea className={field+' sm:col-span-2 lg:col-span-4'} rows="2" placeholder="Description (optional)" value={form.description} onChange={(e)=>setForm({...form,description:e.target.value})}/>
    </form></section>
    <section className={card}><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">Onboarding checklist</h2><p className="text-sm text-slate-500">Update each task as the employee progresses.</p></div><select className={field+' w-auto'} value={filter} onChange={(e)=>setFilter(e.target.value)}><option value="All">All employees</option>{employees.map((e)=><option key={e.id} value={e.id}>{e.full_name}</option>)}</select></div>
      <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[600px] text-left text-sm"><thead className="border-b text-slate-500"><tr>{['Employee','Task','Due date','Status'].map((x)=><th key={x} className="px-3 py-3 font-medium">{x}</th>)}</tr></thead><tbody className="divide-y">{shown.map((t)=><tr key={t.id}><td className="px-3 py-3 font-medium">{t.employees?.full_name}<span className="block text-xs text-slate-500">{t.employees?.emp_id}</span></td><td className="px-3 py-3">{t.task_title}{t.description&&<span className="block text-xs text-slate-500">{t.description}</span>}</td><td className="px-3 py-3">{t.due_date||'—'}</td><td className="px-3 py-3"><select className={field+' min-w-36'} aria-label={'Status for '+t.task_title} value={t.status} onChange={(e)=>changeStatus(t,e.target.value)}>{statuses.map((s)=><option key={s}>{s}</option>)}</select></td></tr>)}</tbody></table>{!loading&&shown.length===0&&<p className="py-8 text-center text-sm text-slate-500">No tasks yet.</p>}</div>
    </section>
  </div>
}

