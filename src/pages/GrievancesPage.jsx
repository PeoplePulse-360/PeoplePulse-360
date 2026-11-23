import { useEffect, useMemo, useState } from "react"
import { supabase } from "../utils/supabaseClient"

const CATEGORIES = ["Workplace conduct", "Pay and benefits", "Workload", "Manager issue", "Facilities", "Other"]
const STATUS_LABEL = { open: "Open", in_review: "In review", resolved: "Resolved" }
const STATUS_STYLE = {
  open: "bg-rose-50 text-rose-700 ring-rose-600/20",
  in_review: "bg-amber-50 text-amber-700 ring-amber-600/20",
  resolved: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
}
const EMPTY = { employee_id: "", category: CATEGORIES[0], subject: "", description: "" }
const fmt = (iso) => (iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "-")

export default function GrievancesPage() {
  const [items, setItems] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [search, setSearch] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [view, setView] = useState(null)
  const [reply, setReply] = useState({ status: "open", hr_response: "" })
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)

  async function load() {
    const [g, e] = await Promise.all([
      supabase.from("grievances").select("*, employees(full_name, department, emp_id)").order("created_at", { ascending: false }),
      supabase.from("employees").select("id, full_name, emp_id").order("full_name"),
    ])
    if (g.error) setLoadError(g.error.message)
    else { setLoadError(""); setItems(g.data) }
    if (e.data) setEmployees(e.data)
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  function showToast(text, type = "ok") {
    setToast({ text, type })
    setTimeout(() => setToast(null), 3000)
  }

  const count = (s) => items.filter((i) => i.status === s).length
  const stats = [["Total", items.length, "text-slate-900"], ["Open", count("open"), "text-rose-700"], ["In review", count("in_review"), "text-amber-700"], ["Resolved", count("resolved"), "text-emerald-700"]]

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter((i) =>
      (statusFilter === "All" || i.status === statusFilter) &&
      (!q || [i.subject, i.category, i.employees?.full_name].some((v) => (v || "").toLowerCase().includes(q)))
    )
  }, [items, statusFilter, search])

  function openView(item) {
    setView(item)
    setReply({ status: item.status, hr_response: item.hr_response || "" })
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!form.subject.trim()) return showToast("Enter a subject.", "error")
    setSaving(true)
    const { error } = await supabase.from("grievances").insert({
      employee_id: form.employee_id || null, category: form.category, subject: form.subject.trim(), description: form.description.trim() || null,
    })
    setSaving(false)
    if (error) return showToast("Could not save: " + error.message, "error")
    showToast("Grievance recorded")
    setFormOpen(false)
    setForm(EMPTY)
    load()
  }

  async function handleReply() {
    setSaving(true)
    const { error } = await supabase.from("grievances").update({
      status: reply.status,
      hr_response: reply.hr_response.trim() || null,
      resolved_at: reply.status === "resolved" ? new Date().toISOString() : null,
    }).eq("id", view.id)
    setSaving(false)
    if (error) return showToast("Could not update: " + error.message, "error")
    showToast("Grievance updated")
    setView(null)
    load()
  }

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Grievances</h1>
          <p className="mt-1 text-sm text-slate-500">Record employee concerns, reply to them and track each one to resolution.</p>
        </div>
        <button onClick={() => setFormOpen(true)} className="rounded-lg bg-violet-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-800">New grievance</button>
      </div>

      {loadError && <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">Could not load grievances: {loadError}</div>}

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(([label, value, tone]) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">{label}</p>
            <p className={`mt-2 text-3xl font-semibold ${tone}`}>{loading ? "-" : value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by subject, category or employee"
          className="min-w-[240px] flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-600/30" />
        <select aria-label="Filter by status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-violet-600">
          <option value="All">All statuses</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
            <tr><th className="px-5 py-3 font-medium">Subject</th><th className="px-5 py-3 font-medium">Raised by</th><th className="px-5 py-3 font-medium">Category</th><th className="px-5 py-3 font-medium">Date</th><th className="px-5 py-3 font-medium">Status</th><th className="px-5 py-3 text-right font-medium">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visible.map((i) => (
              <tr key={i.id} className="hover:bg-slate-50/70">
                <td className="px-5 py-3 font-medium text-slate-900">{i.subject}</td>
                <td className="px-5 py-3 text-slate-700">{i.employees?.full_name || "Anonymous"}</td>
                <td className="px-5 py-3 text-slate-700">{i.category}</td>
                <td className="px-5 py-3 text-slate-700">{fmt(i.created_at)}</td>
                <td className="px-5 py-3"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${STATUS_STYLE[i.status]}`}>{STATUS_LABEL[i.status]}</span></td>
                <td className="px-5 py-3 text-right"><button onClick={() => openView(i)} className="rounded-md px-2.5 py-1.5 text-sm font-medium text-violet-700 hover:bg-violet-50">Open</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <p className="px-5 py-14 text-center text-sm text-slate-500">Loading grievances...</p>}
        {!loading && visible.length === 0 && <div className="px-5 py-14 text-center"><p className="font-medium text-slate-900">{items.length === 0 ? "No grievances yet" : "No grievances match your search"}</p><p className="mt-1 text-sm text-slate-500">{items.length === 0 ? "Click New grievance to record one." : "Clear the search or change the status filter."}</p></div>}
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={() => setFormOpen(false)}>
          <form onSubmit={handleCreate} onClick={(e) => e.stopPropagation()} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900">New grievance</h2>
            <div className="mt-5 grid gap-4">
              <label className="text-sm font-medium text-slate-700">Raised by (optional)
                <select className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={form.employee_id} onChange={(e) => setForm({ ...form, employee_id: e.target.value })}>
                  <option value="">Anonymous</option>
                  {employees.map((x) => <option key={x.id} value={x.id}>{x.full_name} ({x.emp_id})</option>)}
                </select>
              </label>
              <label className="text-sm font-medium text-slate-700">Category
                <select className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
              </label>
              <label className="text-sm font-medium text-slate-700">Subject
                <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
              </label>
              <label className="text-sm font-medium text-slate-700">Details
                <textarea rows={4} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setFormOpen(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
              <button type="submit" disabled={saving} className="rounded-lg bg-violet-700 px-4 py-2 text-sm font-medium text-white hover:bg-violet-800 disabled:opacity-60">{saving ? "Saving..." : "Submit"}</button>
            </div>
          </form>
        </div>
      )}

      {view && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={() => setView(null)}>
          <div onClick={(e) => e.stopPropagation()} className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900">{view.subject}</h2>
            <p className="mt-1 text-xs text-slate-500">{view.category} · {view.employees?.full_name || "Anonymous"} · {fmt(view.created_at)}</p>
            <p className="mt-4 whitespace-pre-wrap text-sm text-slate-800">{view.description || "No details were added."}</p>
            <div className="mt-6 grid gap-4 border-t border-slate-100 pt-5">
              <label className="text-sm font-medium text-slate-700">Status
                <select className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={reply.status} onChange={(e) => setReply({ ...reply, status: e.target.value })}>
                  {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </label>
              <label className="text-sm font-medium text-slate-700">HR response
                <textarea rows={4} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={reply.hr_response} onChange={(e) => setReply({ ...reply, hr_response: e.target.value })} />
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setView(null)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Close</button>
              <button onClick={handleReply} disabled={saving} className="rounded-lg bg-violet-700 px-4 py-2 text-sm font-medium text-white hover:bg-violet-800 disabled:opacity-60">{saving ? "Saving..." : "Save update"}</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div role="status" className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg px-4 py-2.5 text-sm text-white shadow-lg ${toast.type === "error" ? "bg-rose-700" : "bg-slate-900"}`}>{toast.text}</div>}
    </div>
  )
}
