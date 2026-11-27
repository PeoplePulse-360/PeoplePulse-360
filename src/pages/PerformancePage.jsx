import { useEffect, useMemo, useState } from "react"
import { supabase } from "../utils/supabaseClient"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { axisTick, gridStroke, series } from "../components/charts/chartTheme"

const EMPTY_REVIEW = { employee_id: "", reviewer_name: "", period: "", rating: "4", goals_met: "80", comments: "" }
const EMPTY_GOAL = { employee_id: "", title: "", description: "", target_date: "", progress: "0" }
const GOAL_LABEL = { pending: "Pending", in_progress: "In progress", completed: "Completed" }
const GOAL_STYLE = {
  pending: "bg-slate-100 text-slate-700 ring-slate-500/20",
  in_progress: "bg-amber-50 text-amber-700 ring-amber-600/20",
  completed: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
}
const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0)
const goalStatus = (p) => (p >= 100 ? "completed" : p > 0 ? "in_progress" : "pending")
const fmt = (iso) => (iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "-")
const inputClass = "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--primary,#A29BEA)]"

export default function PerformancePage() {
  const [tab, setTab] = useState("reviews")
  const [reviews, setReviews] = useState([])
  const [goals, setGoals] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [goalsError, setGoalsError] = useState("")
  const [search, setSearch] = useState("")
  const [sumEmp, setSumEmp] = useState("")
  const [reviewOpen, setReviewOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_REVIEW)
  const [goalOpen, setGoalOpen] = useState(false)
  const [goalForm, setGoalForm] = useState(EMPTY_GOAL)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [toast, setToast] = useState(null)

  async function load() {
    const [rv, gl, em] = await Promise.all([
      supabase.from("performance_reviews").select("*, employees(full_name, department, emp_id)").order("created_at", { ascending: false }),
      supabase.from("employee_goals").select("*, employees(full_name, department, emp_id)").order("created_at", { ascending: false }),
      supabase.from("employees").select("id, full_name, department, emp_id").order("full_name"),
    ])
    if (rv.error) setLoadError(rv.error.message)
    else { setLoadError(""); setReviews(rv.data) }
    if (gl.error) setGoalsError(gl.error.message)
    else { setGoalsError(""); setGoals(gl.data) }
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
    ["Goals completed", goals.filter((g) => g.status === "completed").length + " of " + goals.length],
    ["Goals pending or in progress", goals.filter((g) => g.status !== "completed").length],
  ], [reviews, goals])

  const byDept = useMemo(() => {
    const depts = [...new Set(reviews.map((r) => r.employees?.department).filter(Boolean))]
    return depts.map((d) => ({ dept: d, avg: Number(avg(reviews.filter((r) => r.employees?.department === d).map((r) => r.rating)).toFixed(2)) }))
  }, [reviews])

  const dist = useMemo(() => [1, 2, 3, 4, 5].map((n) => ({ label: n + "★", count: reviews.filter((r) => r.rating === n).length })), [reviews])

  const visibleReviews = useMemo(() => {
    const q = search.trim().toLowerCase()
    return reviews.filter((r) => !q || [r.employees?.full_name, r.employees?.emp_id, r.period, r.reviewer_name].some((v) => (v || "").toLowerCase().includes(q)))
  }, [reviews, search])

  const summary = useMemo(() => {
    if (!sumEmp) return null
    const rv = reviews.filter((r) => r.employee_id === sumEmp)
    const gl = goals.filter((g) => g.employee_id === sumEmp)
    return {
      name: employees.find((e) => e.id === sumEmp)?.full_name,
      reviewCount: rv.length,
      avgRating: rv.length ? avg(rv.map((r) => r.rating)).toFixed(1) : "-",
      latest: rv[0],
      goalTotal: gl.length,
      goalDone: gl.filter((g) => g.status === "completed").length,
      goalProgress: gl.length ? Math.round(avg(gl.map((g) => g.progress || 0))) : 0,
    }
  }, [sumEmp, reviews, goals, employees])

  async function saveReview(e) {
    e.preventDefault()
    if (!form.employee_id) return showToast("Pick an employee.", "error")
    if (!form.reviewer_name.trim()) return showToast("Enter the reviewer's name.", "error")
    if (!form.period.trim()) return showToast("Enter the review period, like Q3 2026.", "error")
    const goalsMet = Number(form.goals_met)
    if (isNaN(goalsMet) || goalsMet < 0 || goalsMet > 100) return showToast("Goals met must be between 0 and 100.", "error")
    setSaving(true)
    const { error } = await supabase.from("performance_reviews").insert({
      employee_id: form.employee_id, reviewer_name: form.reviewer_name.trim(), period: form.period.trim(),
      rating: Number(form.rating), goals_met: goalsMet, comments: form.comments.trim() || null,
    })
    setSaving(false)
    if (error) return showToast("Could not save: " + error.message, "error")
    showToast("Review added")
    setReviewOpen(false)
    setForm(EMPTY_REVIEW)
    load()
  }

  async function saveGoal(e) {
    e.preventDefault()
    if (!goalForm.employee_id) return showToast("Pick an employee.", "error")
    if (!goalForm.title.trim()) return showToast("Enter a goal title.", "error")
    const progress = Number(goalForm.progress)
    if (isNaN(progress) || progress < 0 || progress > 100) return showToast("Progress must be between 0 and 100.", "error")
    setSaving(true)
    const { error } = await supabase.from("employee_goals").insert({
      employee_id: goalForm.employee_id, title: goalForm.title.trim(), description: goalForm.description.trim() || null,
      target_date: goalForm.target_date || null, progress, status: goalStatus(progress),
    })
    setSaving(false)
    if (error) return showToast("Could not save: " + error.message, "error")
    showToast("Goal added")
    setGoalOpen(false)
    setGoalForm(EMPTY_GOAL)
    load()
  }

  function slideGoal(id, progress) {
    setGoals(goals.map((g) => (g.id === id ? { ...g, progress, status: goalStatus(progress) } : g)))
  }

  async function commitGoal(g) {
    const { error } = await supabase.from("employee_goals").update({ progress: g.progress, status: goalStatus(g.progress) }).eq("id", g.id)
    if (error) { showToast("Could not update: " + error.message, "error"); load() }
  }

  async function confirmDelete() {
    const table = deleteTarget.kind === "goal" ? "employee_goals" : "performance_reviews"
    const { error } = await supabase.from(table).delete().eq("id", deleteTarget.row.id)
    if (error) return showToast("Could not delete: " + error.message, "error")
    setDeleteTarget(null)
    showToast("Deleted")
    load()
  }

  const tabClass = (t) => `rounded-lg px-4 py-2 text-sm font-medium transition-colors ${tab === t ? "bg-[var(--primary,#A29BEA)] text-white" : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50"}`

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Performance</h1>
          <p className="mt-1 text-sm text-slate-500">Record reviews, set goals and track progress for every employee.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setGoalOpen(true)} className="rounded-lg border border-[var(--primary,#A29BEA)] bg-white px-4 py-2.5 text-sm font-medium text-[var(--primary-hover,#8F87DC)] hover:bg-[var(--primary-light,#F0EEFC)]">Add goal</button>
          <button onClick={() => setReviewOpen(true)} className="rounded-lg bg-[var(--primary,#A29BEA)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--primary-hover,#8F87DC)]">Add review</button>
        </div>
      </div>

      {loadError && <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">Could not load reviews: {loadError}</div>}
      {goalsError && <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Goals are not available yet: {goalsError}</div>}

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
            <div className="mt-4 h-64"><ResponsiveContainer><BarChart data={byDept}><CartesianGrid stroke={gridStroke} strokeDasharray="3 3" vertical={false} /><XAxis dataKey="dept" interval={0} tick={axisTick} /><YAxis domain={[0, 5]} tick={axisTick} /><Tooltip /><Bar dataKey="avg" name="Average rating" fill={series.blue} radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-base font-semibold text-slate-900">Rating distribution</h2>
            <div className="mt-4 h-64"><ResponsiveContainer><BarChart data={dist}><CartesianGrid stroke={gridStroke} strokeDasharray="3 3" vertical={false} /><XAxis dataKey="label" tick={axisTick} /><YAxis allowDecimals={false} tick={axisTick} /><Tooltip /><Bar dataKey="count" name="Reviews" fill={series.indigo} radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div>
          </div>
        </div>
      )}

      {/* Employee summary */}
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-900">Employee performance summary</h2>
          <select aria-label="Choose employee" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" value={sumEmp} onChange={(e) => setSumEmp(e.target.value)}>
            <option value="">Choose an employee</option>
            {employees.map((x) => <option key={x.id} value={x.id}>{x.full_name} ({x.emp_id})</option>)}
          </select>
        </div>
        {!summary && <p className="mt-4 text-sm text-slate-500">Choose an employee to see their reviews and goals in one place.</p>}
        {summary && (
          <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div><p className="text-xs text-slate-500">Reviews</p><p className="text-xl font-semibold text-slate-900">{summary.reviewCount}</p></div>
            <div><p className="text-xs text-slate-500">Average rating</p><p className="text-xl font-semibold text-slate-900">{summary.avgRating}</p></div>
            <div><p className="text-xs text-slate-500">Goals completed</p><p className="text-xl font-semibold text-slate-900">{summary.goalDone} of {summary.goalTotal}</p></div>
            <div><p className="text-xs text-slate-500">Average goal progress</p><p className="text-xl font-semibold text-slate-900">{summary.goalProgress}%</p></div>
            <p className="col-span-2 text-sm text-slate-600 lg:col-span-4">{summary.latest ? `Latest review: ${summary.latest.period}, rated ${summary.latest.rating} out of 5 by ${summary.latest.reviewer_name || "an unnamed reviewer"}.` : `${summary.name} has no reviews yet.`}</p>
          </div>
        )}
      </div>

      <div className="mt-6 flex gap-2">
        <button onClick={() => setTab("reviews")} className={tabClass("reviews")}>Reviews</button>
        <button onClick={() => setTab("goals")} className={tabClass("goals")}>Goals</button>
      </div>

      {tab === "reviews" && (
        <>
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by employee, ID, reviewer or period"
            className="mt-4 w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-[var(--primary,#A29BEA)] focus:ring-2 focus:ring-[var(--primary-light,#F0EEFC)]" />
          <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <tr><th className="px-5 py-3 font-medium">Employee</th><th className="px-5 py-3 font-medium">Period</th><th className="px-5 py-3 font-medium">Reviewer</th><th className="px-5 py-3 font-medium">Rating</th><th className="px-5 py-3 font-medium">Goals met</th><th className="px-5 py-3 font-medium">Comments</th><th className="px-5 py-3 text-right font-medium">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleReviews.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3"><p className="font-medium text-slate-900">{r.employees?.full_name || "Unknown"}</p><p className="text-xs text-slate-500">{r.employees?.department} · {r.employees?.emp_id}</p></td>
                    <td className="px-5 py-3 text-slate-700">{r.period}</td>
                    <td className="px-5 py-3 text-slate-700">{r.reviewer_name || "-"}</td>
                    <td className="px-5 py-3 font-medium text-slate-900">{r.rating} / 5</td>
                    <td className="px-5 py-3"><div className="flex items-center gap-2"><div className="h-2 w-24 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-[var(--primary,#A29BEA)]" style={{ width: `${r.goals_met || 0}%` }} /></div><span className="text-xs text-slate-600">{r.goals_met || 0}%</span></div></td>
                    <td className="max-w-xs px-5 py-3 text-slate-700">{r.comments || "-"}</td>
                    <td className="px-5 py-3 text-right"><button onClick={() => setDeleteTarget({ kind: "review", row: r })} className="rounded-md px-2.5 py-1.5 text-sm font-medium text-rose-600 hover:bg-rose-50">Delete</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {loading && <p className="px-5 py-14 text-center text-sm text-slate-500">Loading reviews...</p>}
            {!loading && visibleReviews.length === 0 && <div className="px-5 py-14 text-center"><p className="font-medium text-slate-900">{reviews.length === 0 ? "No reviews yet" : "No reviews match your search"}</p><p className="mt-1 text-sm text-slate-500">{reviews.length === 0 ? "Click Add review to create the first one." : "Clear the search box to see more."}</p></div>}
          </div>
        </>
      )}

      {tab === "goals" && (
        <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
              <tr><th className="px-5 py-3 font-medium">Employee</th><th className="px-5 py-3 font-medium">Goal</th><th className="px-5 py-3 font-medium">Target date</th><th className="px-5 py-3 font-medium">Progress (drag to update)</th><th className="px-5 py-3 font-medium">Status</th><th className="px-5 py-3 text-right font-medium">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {goals.map((g) => (
                <tr key={g.id} className="hover:bg-slate-50/70">
                  <td className="px-5 py-3"><p className="font-medium text-slate-900">{g.employees?.full_name || "Unknown"}</p><p className="text-xs text-slate-500">{g.employees?.emp_id}</p></td>
                  <td className="px-5 py-3"><p className="font-medium text-slate-900">{g.title}</p>{g.description && <p className="text-xs text-slate-500">{g.description}</p>}</td>
                  <td className="px-5 py-3 text-slate-700">{fmt(g.target_date)}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <input type="range" min="0" max="100" step="5" aria-label={`Progress for ${g.title}`} value={g.progress || 0} className="w-32 accent-violet-700"
                        onChange={(e) => slideGoal(g.id, Number(e.target.value))} onPointerUp={() => commitGoal(g)} onKeyUp={() => commitGoal(g)} />
                      <span className="w-10 text-xs text-slate-600">{g.progress || 0}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-3"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${GOAL_STYLE[g.status]}`}>{GOAL_LABEL[g.status]}</span></td>
                  <td className="px-5 py-3 text-right"><button onClick={() => setDeleteTarget({ kind: "goal", row: g })} className="rounded-md px-2.5 py-1.5 text-sm font-medium text-rose-600 hover:bg-rose-50">Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && goals.length === 0 && <div className="px-5 py-14 text-center"><p className="font-medium text-slate-900">No goals yet</p><p className="mt-1 text-sm text-slate-500">Click Add goal to create the first one.</p></div>}
        </div>
      )}

      {reviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={() => setReviewOpen(false)}>
          <form onSubmit={saveReview} onClick={(e) => e.stopPropagation()} className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900">Add performance review</h2>
            <div className="mt-5 grid gap-4">
              <label className="text-sm font-medium text-slate-700">Employee
                <select className={inputClass} value={form.employee_id} onChange={(e) => setForm({ ...form, employee_id: e.target.value })}>
                  <option value="">Choose an employee</option>
                  {employees.map((x) => <option key={x.id} value={x.id}>{x.full_name} ({x.emp_id})</option>)}
                </select>
              </label>
              <label className="text-sm font-medium text-slate-700">Reviewer name
                <input className={inputClass} placeholder="Who is giving this review?" value={form.reviewer_name} onChange={(e) => setForm({ ...form, reviewer_name: e.target.value })} />
              </label>
              <label className="text-sm font-medium text-slate-700">Review period
                <input className={inputClass} placeholder="For example Q3 2026" value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} />
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="text-sm font-medium text-slate-700">Rating
                  <select className={inputClass} value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })}>{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} stars</option>)}</select>
                </label>
                <label className="text-sm font-medium text-slate-700">Goals met (0 to 100)
                  <input inputMode="numeric" className={inputClass} value={form.goals_met} onChange={(e) => setForm({ ...form, goals_met: e.target.value })} />
                </label>
              </div>
              <label className="text-sm font-medium text-slate-700">Comments (optional)
                <textarea rows={3} className={inputClass} value={form.comments} onChange={(e) => setForm({ ...form, comments: e.target.value })} />
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setReviewOpen(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
              <button type="submit" disabled={saving} className="rounded-lg bg-[var(--primary,#A29BEA)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--primary-hover,#8F87DC)] disabled:opacity-60">{saving ? "Saving..." : "Save review"}</button>
            </div>
          </form>
        </div>
      )}

      {goalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={() => setGoalOpen(false)}>
          <form onSubmit={saveGoal} onClick={(e) => e.stopPropagation()} className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900">Add employee goal</h2>
            <div className="mt-5 grid gap-4">
              <label className="text-sm font-medium text-slate-700">Employee
                <select className={inputClass} value={goalForm.employee_id} onChange={(e) => setGoalForm({ ...goalForm, employee_id: e.target.value })}>
                  <option value="">Choose an employee</option>
                  {employees.map((x) => <option key={x.id} value={x.id}>{x.full_name} ({x.emp_id})</option>)}
                </select>
              </label>
              <label className="text-sm font-medium text-slate-700">Goal title
                <input className={inputClass} placeholder="For example Complete certification" value={goalForm.title} onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })} />
              </label>
              <label className="text-sm font-medium text-slate-700">Description (optional)
                <textarea rows={2} className={inputClass} value={goalForm.description} onChange={(e) => setGoalForm({ ...goalForm, description: e.target.value })} />
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="text-sm font-medium text-slate-700">Target date
                  <input type="date" className={inputClass} value={goalForm.target_date} onChange={(e) => setGoalForm({ ...goalForm, target_date: e.target.value })} />
                </label>
                <label className="text-sm font-medium text-slate-700">Starting progress (0 to 100)
                  <input inputMode="numeric" className={inputClass} value={goalForm.progress} onChange={(e) => setGoalForm({ ...goalForm, progress: e.target.value })} />
                </label>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setGoalOpen(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
              <button type="submit" disabled={saving} className="rounded-lg bg-[var(--primary,#A29BEA)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--primary-hover,#8F87DC)] disabled:opacity-60">{saving ? "Saving..." : "Save goal"}</button>
            </div>
          </form>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={() => setDeleteTarget(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900">Delete this {deleteTarget.kind}?</h2>
            <p className="mt-2 text-sm text-slate-600">This removes it from the database. You can't undo this.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setDeleteTarget(null)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Keep it</button>
              <button onClick={confirmDelete} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700">Delete</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div role="status" className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg px-4 py-2.5 text-sm text-white shadow-lg ${toast.type === "error" ? "bg-rose-700" : "bg-slate-900"}`}>{toast.text}</div>}
    </div>
  )
}
