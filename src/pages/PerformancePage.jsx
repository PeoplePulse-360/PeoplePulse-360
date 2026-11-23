import { useEffect, useMemo, useState } from "react"
import { supabase } from "../utils/supabaseClient"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

const EMPTY = { employee_id: "", period: "", rating: "4", goals_met: "80", comments: "" }
const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0)

export default function PerformancePage() {
  const [reviews, setReviews] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [search, setSearch] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [toast, setToast] = useState(null)

  async function load() {
    const [rv, em] = await Promise.all([
      supabase.from("performance_reviews").select("*, employees(full_name, department, emp_id)").order("created_at", { ascending: false }),
      supabase.from("employees").select("id, full_name, department, emp_id").order("full_name"),
    ])
    if (rv.error) setLoadError(rv.error.message)
    else { setLoadError(""); setReviews(rv.data) }
    if (em.data) setEmployees(em.data)
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  function showToast(text, type = "ok") {
    setToast({ text, type })
    setTimeout(() => setToast(null), 3000)
  }

  const stats = useMemo(() => [
    ["Total reviews", reviews.length],
    ["Average rating", reviews.length ? avg(reviews.map((r) => r.rating)).toFixed(1) + " / 5" : "-"],
    ["Average goals met", reviews.length ? Math.round(avg(reviews.map((r) => r.goals_met || 0))) + "%" : "-"],
    ["Employees reviewed", new Set(reviews.map((r) => r.employee_id)).size + " of " + employees.length],
  ], [reviews, employees])

  const byDept = useMemo(() => {
    const depts = [...new Set(reviews.map((r) => r.employees?.department).filter(Boolean))]
    return depts.map((d) => ({ dept: d, avg: Number(avg(reviews.filter((r) => r.employees?.department === d).map((r) => r.rating)).toFixed(2)) }))
  }, [reviews])

  const dist = useMemo(() => [1, 2, 3, 4, 5].map((n) => ({ label: n + "★", count: reviews.filter((r) => r.rating === n).length })), [reviews])

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    return reviews.filter((r) => !q || [r.employees?.full_name, r.employees?.emp_id, r.period].some((v) => (v || "").toLowerCase().includes(q)))
  }, [reviews, search])

  async function handleSave(e) {
    e.preventDefault()
    if (!form.employee_id) return showToast("Pick an employee.", "error")
    if (!form.period.trim()) return showToast("Enter the review period, like Q3 2026.", "error")
    const goals = Number(form.goals_met)
    if (isNaN(goals) || goals < 0 || goals > 100) return showToast("Goals met must be between 0 and 100.", "error")
    setSaving(true)
    const { error } = await supabase.from("performance_reviews").insert({
      employee_id: form.employee_id, period: form.period.trim(), rating: Number(form.rating), goals_met: goals, comments: form.comments.trim() || null,
    })
    setSaving(false)
    if (error) return showToast("Could not save: " + error.message, "error")
    showToast("Review added")
    setFormOpen(false)
    setForm(EMPTY)
    load()
  }

  async function confirmDelete() {
    const { error } = await supabase.from("performance_reviews").delete().eq("id", deleteTarget.id)
    if (error) return showToast("Could not delete: " + error.message, "error")
    setDeleteTarget(null)
    showToast("Review deleted")
    load()
  }

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Performance</h1>
          <p className="mt-1 text-sm text-slate-500">Record and track performance reviews for every employee.</p>
        </div>
        <button onClick={() => setFormOpen(true)} className="rounded-lg bg-violet-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-800">Add review</button>
      </div>

      {loadError && <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">Could not load reviews: {loadError}</div>}

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{loading ? "-" : value}</p>
          </div>
        ))}
      </div>

      {reviews.length > 0 && (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-base font-semibold text-slate-900">Average rating by department</h2>
            <div className="mt-4 h-64"><ResponsiveContainer><BarChart data={byDept}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="dept" /><YAxis domain={[0, 5]} /><Tooltip /><Bar dataKey="avg" name="Average rating" fill="#7c3aed" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-base font-semibold text-slate-900">Rating distribution</h2>
            <div className="mt-4 h-64"><ResponsiveContainer><BarChart data={dist}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="label" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="count" name="Reviews" fill="#6366f1" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div>
          </div>
        </div>
      )}

      <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by employee, ID or period"
        className="mt-6 w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-600/30" />

      <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
            <tr><th className="px-5 py-3 font-medium">Employee</th><th className="px-5 py-3 font-medium">Period</th><th className="px-5 py-3 font-medium">Rating</th><th className="px-5 py-3 font-medium">Goals met</th><th className="px-5 py-3 font-medium">Comments</th><th className="px-5 py-3 text-right font-medium">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visible.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50/70">
                <td className="px-5 py-3"><p className="font-medium text-slate-900">{r.employees?.full_name || "Unknown"}</p><p className="text-xs text-slate-500">{r.employees?.department} · {r.employees?.emp_id}</p></td>
                <td className="px-5 py-3 text-slate-700">{r.period}</td>
                <td className="px-5 py-3 font-medium text-slate-900">{r.rating} / 5</td>
                <td className="px-5 py-3"><div className="flex items-center gap-2"><div className="h-2 w-24 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-violet-600" style={{ width: `${r.goals_met || 0}%` }} /></div><span className="text-xs text-slate-600">{r.goals_met || 0}%</span></div></td>
                <td className="max-w-xs px-5 py-3 text-slate-700">{r.comments || "-"}</td>
                <td className="px-5 py-3 text-right"><button onClick={() => setDeleteTarget(r)} className="rounded-md px-2.5 py-1.5 text-sm font-medium text-rose-600 hover:bg-rose-50">Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <p className="px-5 py-14 text-center text-sm text-slate-500">Loading reviews...</p>}
        {!loading && visible.length === 0 && <div className="px-5 py-14 text-center"><p className="font-medium text-slate-900">{reviews.length === 0 ? "No reviews yet" : "No reviews match your search"}</p><p className="mt-1 text-sm text-slate-500">{reviews.length === 0 ? "Click Add review to create the first one." : "Clear the search box to see more."}</p></div>}
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={() => setFormOpen(false)}>
          <form onSubmit={handleSave} onClick={(e) => e.stopPropagation()} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900">Add performance review</h2>
            <div className="mt-5 grid gap-4">
              <label className="text-sm font-medium text-slate-700">Employee
                <select className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={form.employee_id} onChange={(e) => setForm({ ...form, employee_id: e.target.value })}>
                  <option value="">Choose an employee</option>
                  {employees.map((x) => <option key={x.id} value={x.id}>{x.full_name} ({x.emp_id})</option>)}
                </select>
              </label>
              <label className="text-sm font-medium text-slate-700">Review period
                <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="For example Q3 2026" value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} />
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="text-sm font-medium text-slate-700">Rating
                  <select className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })}>{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} stars</option>)}</select>
                </label>
                <label className="text-sm font-medium text-slate-700">Goals met (0 to 100)
                  <input inputMode="numeric" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={form.goals_met} onChange={(e) => setForm({ ...form, goals_met: e.target.value })} />
                </label>
              </div>
              <label className="text-sm font-medium text-slate-700">Comments (optional)
                <textarea rows={3} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={form.comments} onChange={(e) => setForm({ ...form, comments: e.target.value })} />
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setFormOpen(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
              <button type="submit" disabled={saving} className="rounded-lg bg-violet-700 px-4 py-2 text-sm font-medium text-white hover:bg-violet-800 disabled:opacity-60">{saving ? "Saving..." : "Save review"}</button>
            </div>
          </form>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={() => setDeleteTarget(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900">Delete this review?</h2>
            <p className="mt-2 text-sm text-slate-600">This removes the review for {deleteTarget.employees?.full_name || "this employee"}. You can't undo this.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setDeleteTarget(null)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Keep review</button>
              <button onClick={confirmDelete} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700">Delete review</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div role="status" className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg px-4 py-2.5 text-sm text-white shadow-lg ${toast.type === "error" ? "bg-rose-700" : "bg-slate-900"}`}>{toast.text}</div>}
    </div>
  )
}
