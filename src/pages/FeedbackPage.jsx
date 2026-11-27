import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { supabase } from "../utils/supabaseClient"
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { gridStroke, series } from "../components/charts/chartTheme"

const DEPARTMENTS = ["Engineering", "Human Resources", "Marketing", "Sales", "Finance", "Operations"]
const SENT_COLORS = { positive: series.emerald, neutral: series.slate, negative: series.rose }
const SENT_BADGE = {
  positive: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  neutral: "bg-slate-100 text-slate-700 ring-slate-500/20",
  negative: "bg-rose-50 text-rose-700 ring-rose-600/20",
}
const STOP = new Set("the a an and or but of to in on for with is are was were be been it this that at as by from we our i my you your they them their have has had not no very so too can could would should will just more most than then there here what when which who how all any some about into out up down over also get got really much many its".split(" "))
const EMPTY_FORM = { event: "", department: DEPARTMENTS[0], rating: "4", comment: "" }
const EMPTY_FILTERS = { days: "all", event: "All", department: "All", sentiment: "All", rating: "All" }

const sentOf = (r) => r.sentiment || (r.rating >= 4 ? "positive" : r.rating === 3 ? "neutral" : "negative")
const monthOf = (r) => (r.created_at || "").slice(0, 7)
const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0)
const pick = (d, k) => d?.[k] ?? d?.payload?.[k]
const fmtMonth = (m) => (m ? new Date(m + "-01").toLocaleDateString("en-IN", { month: "short", year: "2-digit" }) : "")

function wordCounts(rows) {
  const m = {}
  rows.forEach((r) =>
    (r.comment || "").toLowerCase().replace(/[^a-z\s]/g, " ").split(/\s+/).forEach((w) => {
      if (w.length > 2 && !STOP.has(w)) m[w] = (m[w] || 0) + 1
    })
  )
  return Object.entries(m).map(([word, count]) => ({ word, count })).sort((a, b) => b.count - a.count)
}

function matchDrill(r, d) {
  if (!d) return true
  if (d.kind === "sentiment") return sentOf(r) === d.value
  if (d.kind === "rating") return r.rating === Number(d.value)
  if (d.kind === "month") return monthOf(r) === d.value
  if (d.kind === "event") return r.event === d.value
  if (d.kind === "word") return (r.comment || "").toLowerCase().includes(d.value)
  if (d.kind === "cell") return r.department === d.value.dept && monthOf(r) === d.value.month
  return true
}

function cellClass(v) {
  if (v === null) return "bg-slate-50 text-slate-400"
  if (v < 2.5) return "bg-[var(--info,#8C9FD5)] text-slate-900"
  if (v < 3.5) return "bg-[var(--secondary-light,#E9EAF8)] text-slate-900"
  if (v < 4.2) return "bg-[var(--primary-light,#F0EEFC)] text-slate-900"
  return "bg-[var(--primary,#A29BEA)] text-slate-900"
}

function Card({ title, hint, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
      <div className="mt-4">{children}</div>
    </div>
  )
}

export default function FeedbackPage() {
  const [rows, setRows] = useState([])
  const [empCount, setEmpCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [drill, setDrill] = useState(null)
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)

  async function load() {
    const [fb, emp] = await Promise.all([
      supabase.from("feedback").select("*").order("created_at", { ascending: false }),
      supabase.from("employees").select("id", { count: "exact", head: true }),
    ])
    if (fb.error) setLoadError(fb.error.message)
    else { setLoadError(""); setRows(fb.data) }
    setEmpCount(emp.count || 0)
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  function showToast(text, type = "ok") {
    setToast({ text, type })
    setTimeout(() => setToast(null), 3000)
  }

  const events = useMemo(() => [...new Set(rows.map((r) => r.event).filter(Boolean))].sort(), [rows])

  const filtered = useMemo(() => {
    const cutoff = filters.days === "all" ? 0 : Date.now() - Number(filters.days) * 864e5
    return rows.filter((r) =>
      new Date(r.created_at).getTime() >= cutoff &&
      (filters.event === "All" || r.event === filters.event) &&
      (filters.department === "All" || r.department === filters.department) &&
      (filters.sentiment === "All" || sentOf(r) === filters.sentiment) &&
      (filters.rating === "All" || r.rating === Number(filters.rating))
    )
  }, [rows, filters])

  const stats = useMemo(() => {
    const total = filtered.length
    const pos = filtered.filter((r) => sentOf(r) === "positive").length
    const neg = filtered.filter((r) => sentOf(r) === "negative").length
    const responders = new Set(filtered.map((r) => r.employee_id).filter(Boolean)).size
    return {
      total,
      avg: total ? avg(filtered.map((r) => r.rating)).toFixed(1) : "-",
      rate: empCount && responders ? Math.round((responders / empCount) * 100) + "%" : "-",
      pos: total ? Math.round((pos / total) * 100) + "%" : "-",
      neg: total ? Math.round((neg / total) * 100) + "%" : "-",
    }
  }, [filtered, empCount])

  const sentimentData = useMemo(() =>
    ["positive", "neutral", "negative"].map((s) => ({ name: s, value: filtered.filter((r) => sentOf(r) === s).length })).filter((d) => d.value > 0), [filtered])

  const ratingData = useMemo(() =>
    [1, 2, 3, 4, 5].map((n) => ({ rating: n, label: n + "★", count: filtered.filter((r) => r.rating === n).length })), [filtered])

  const months = useMemo(() => [...new Set(filtered.map(monthOf).filter(Boolean))].sort(), [filtered])

  const trendData = useMemo(() =>
    months.map((m) => {
      const list = filtered.filter((r) => monthOf(r) === m)
      return { month: m, label: fmtMonth(m), avg: Number(avg(list.map((r) => r.rating)).toFixed(2)), count: list.length }
    }), [filtered, months])

  const complaints = useMemo(() => wordCounts(filtered.filter((r) => sentOf(r) === "negative")).slice(0, 8), [filtered])
  const cloud = useMemo(() => wordCounts(filtered).slice(0, 30), [filtered])

  const depts = useMemo(() => [...new Set(filtered.map((r) => r.department).filter(Boolean))].sort(), [filtered])
  const heat = useMemo(() => {
    const cols = months.slice(-6)
    return {
      cols,
      grid: depts.map((d) => ({
        dept: d,
        cells: cols.map((m) => {
          const list = filtered.filter((r) => r.department === d && monthOf(r) === m)
          return { month: m, value: list.length ? Number(avg(list.map((r) => r.rating)).toFixed(1)) : null, n: list.length }
        }),
      })),
    }
  }, [filtered, months, depts])

  const eventData = useMemo(() =>
    events.map((e) => {
      const list = filtered.filter((r) => r.event === e)
      return { event: e, avg: Number(avg(list.map((r) => r.rating)).toFixed(2)), count: list.length }
    }).filter((d) => d.count > 0), [filtered, events])

  const insights = useMemo(() => {
    const out = []
    if (!filtered.length) return out
    const byDept = depts.map((d) => ({ d, a: avg(filtered.filter((r) => r.department === d).map((r) => r.rating)), n: filtered.filter((r) => r.department === d).length }))
    if (byDept.length > 1) {
      const best = [...byDept].sort((a, b) => b.a - a.a)[0]
      const worst = [...byDept].sort((a, b) => a.a - b.a)[0]
      out.push(`${best.d} has the highest average rating (${best.a.toFixed(1)} from ${best.n} responses).`)
      out.push(`${worst.d} has the lowest average rating (${worst.a.toFixed(1)} from ${worst.n} responses). Worth a conversation.`)
    }
    if (trendData.length > 1) {
      const diff = trendData[trendData.length - 1].avg - trendData[trendData.length - 2].avg
      out.push(diff >= 0 ? `Average rating went up by ${diff.toFixed(1)} compared to the previous month.` : `Average rating dropped by ${Math.abs(diff).toFixed(1)} compared to the previous month.`)
    }
    if (complaints[0]) out.push(`The most common word in negative feedback is "${complaints[0].word}" (${complaints[0].count} mentions).`)
    const negShare = filtered.filter((r) => sentOf(r) === "negative").length / filtered.length
    if (negShare > 0.3) out.push(`${Math.round(negShare * 100)}% of the feedback is negative. This is higher than usual.`)
    return out
  }, [filtered, depts, trendData, complaints])

  const shown = useMemo(() => {
    const list = filtered.filter((r) => matchDrill(r, drill))
    return drill ? list : list.slice(0, 10)
  }, [filtered, drill])

  function setF(key, value) { setFilters({ ...filters, [key]: value }); setDrill(null) }
  const selectClass = "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--primary,#A29BEA)]"

  async function handleSave(e) {
    e.preventDefault()
    if (!form.comment.trim()) { showToast("Please write a comment.", "error"); return }
    setSaving(true)
    const rating = Number(form.rating)
    const { error } = await supabase.from("feedback").insert({
      event: form.event.trim() || null,
      department: form.department,
      rating,
      sentiment: rating >= 4 ? "positive" : rating === 3 ? "neutral" : "negative",
      comment: form.comment.trim(),
    })
    setSaving(false)
    if (error) { showToast("Could not save: " + error.message, "error"); return }
    showToast("Feedback added")
    setFormOpen(false)
    setForm(EMPTY_FORM)
    load()
  }

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Feedback analytics</h1>
          <p className="mt-1 text-sm text-slate-500">Click any chart to see the actual feedback behind it.</p>
        </div>
        <div className="flex gap-3"><Link to="/surveys" className="rounded-lg border border-[var(--primary,#A29BEA)] bg-white px-4 py-2.5 text-sm font-medium text-[var(--primary-hover,#8F87DC)] hover:bg-[var(--primary-light,#F0EEFC)]">Surveys</Link><button onClick={() => setFormOpen(true)} className="rounded-lg bg-[var(--primary,#A29BEA)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--primary-hover,#8F87DC)]">Add feedback</button></div>
      </div>

      {loadError && <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">Could not load feedback: {loadError}</div>}

      {/* Filters */}
      <div className="mt-6 flex flex-wrap gap-3">
        <select className={selectClass} aria-label="Date range" value={filters.days} onChange={(e) => setF("days", e.target.value)}>
          <option value="all">All time</option><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option>
        </select>
        <select className={selectClass} aria-label="Event" value={filters.event} onChange={(e) => setF("event", e.target.value)}>
          <option value="All">All events</option>{events.map((x) => <option key={x}>{x}</option>)}
        </select>
        <select className={selectClass} aria-label="Department" value={filters.department} onChange={(e) => setF("department", e.target.value)}>
          <option value="All">All departments</option>{DEPARTMENTS.map((x) => <option key={x}>{x}</option>)}
        </select>
        <select className={selectClass} aria-label="Sentiment" value={filters.sentiment} onChange={(e) => setF("sentiment", e.target.value)}>
          <option value="All">All sentiment</option><option value="positive">Positive</option><option value="neutral">Neutral</option><option value="negative">Negative</option>
        </select>
        <select className={selectClass} aria-label="Rating" value={filters.rating} onChange={(e) => setF("rating", e.target.value)}>
          <option value="All">All ratings</option>{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} stars</option>)}
        </select>
        <button onClick={() => { setFilters(EMPTY_FILTERS); setDrill(null) }} className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--primary-hover,#8F87DC)] hover:bg-[var(--primary-light,#F0EEFC)]">Reset filters</button>
      </div>

      {/* Stat cards */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
        {[
          ["Total responses", stats.total, "text-slate-900"],
          ["Average rating", stats.avg === "-" ? "-" : stats.avg + " / 5", "text-[var(--primary-hover,#8F87DC)]"],
          ["Response rate", stats.rate, "text-slate-900"],
          ["Positive", stats.pos, "text-emerald-700"],
          ["Negative", stats.neg, "text-rose-700"],
        ].map(([label, value, tone]) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">{label}</p>
            <p className={`mt-2 text-3xl font-semibold ${tone}`}>{loading ? "-" : value}</p>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-slate-500">Response rate counts feedback linked to an employee, compared with all employees. Anonymous feedback is not counted in it.</p>

      {!loading && rows.length === 0 && (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center">
          <p className="font-medium text-slate-900">No feedback yet</p>
          <p className="mt-1 text-sm text-slate-500">Click Add feedback to create the first entry. Charts appear once there is data.</p>
        </div>
      )}

      {rows.length > 0 && (
        <>
          {/* AI / auto insights */}
          <div className="mt-6 rounded-2xl border border-[var(--primary-light,#F0EEFC)] bg-[var(--primary-light,#F0EEFC)] p-5">
            <h2 className="text-base font-semibold text-[var(--text-main,#303447)]">Insights</h2>
            <p className="text-xs text-[var(--text-secondary,#777D91)]">Worked out from the feedback shown after your filters.</p>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-800">
              {insights.length ? insights.map((t) => <li key={t}>{t}</li>) : <li>Not enough data for insights yet.</li>}
            </ul>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <Card title="Sentiment" hint="Click a slice">
              <div className="h-64">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={sentimentData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} cursor="pointer" label={(d) => d.name}
                      onClick={(d) => setDrill({ kind: "sentiment", value: pick(d, "name"), label: pick(d, "name") + " feedback" })}>
                      {sentimentData.map((d) => <Cell key={d.name} fill={SENT_COLORS[d.name]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
            <Card title="Ratings" hint="Click a bar">
              <div className="h-64">
                <ResponsiveContainer>
                  <BarChart data={ratingData}>
                    <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: "#777D91", fontSize: 12 }} /><YAxis allowDecimals={false} tick={{ fill: "#777D91", fontSize: 12 }} /><Tooltip />
                    <Bar dataKey="count" fill={series.blue} radius={[6, 6, 0, 0]} cursor="pointer"
                      onClick={(d) => setDrill({ kind: "rating", value: pick(d, "rating"), label: pick(d, "rating") + "-star feedback" })} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
            <Card title="Common complaints" hint="Top words in negative feedback. Click a bar">
              {complaints.length === 0 ? <p className="py-16 text-center text-sm text-slate-500">No negative feedback.</p> : (
                <div className="h-64">
                  <ResponsiveContainer>
                    <BarChart data={complaints} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" allowDecimals={false} tick={{ fill: "#777D91", fontSize: 12 }} /><YAxis type="category" dataKey="word" width={80} tick={{ fill: "#777D91", fontSize: 12 }} /><Tooltip />
                      <Bar dataKey="count" fill={series.rose} radius={[0, 6, 6, 0]} cursor="pointer"
                        onClick={(d) => setDrill({ kind: "word", value: pick(d, "word"), label: `comments mentioning "${pick(d, "word")}"` })} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <Card title="Feedback trend" hint="Average rating by month. Click a point">
              <div className="h-64">
                <ResponsiveContainer>
                  <LineChart data={trendData} onClick={(s) => { const m = s?.activeLabel ? trendData.find((t) => t.label === s.activeLabel)?.month : null; if (m) setDrill({ kind: "month", value: m, label: "feedback from " + fmtMonth(m) }) }}>
                    <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: "#777D91", fontSize: 12 }} /><YAxis domain={[1, 5]} tick={{ fill: "#777D91", fontSize: 12 }} /><Tooltip />
                    <Line type="monotone" dataKey="avg" stroke={series.indigo} strokeWidth={3} dot={{ r: 5, fill: series.blue }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
            <Card title="Word cloud" hint="Bigger words are mentioned more. Click a word">
              <div className="flex min-h-[16rem] flex-wrap items-center justify-center gap-x-4 gap-y-2">
                {cloud.length === 0 && <p className="text-sm text-slate-500">No comments yet.</p>}
                {cloud.map((w, i) => (
                  <button key={w.word} onClick={() => setDrill({ kind: "word", value: w.word, label: `comments mentioning "${w.word}"` })}
                    className={`font-semibold hover:underline ${["text-[var(--primary-hover,#8F87DC)]", "text-slate-800", "text-[var(--info,#8C9FD5)]", "text-[var(--secondary,#B8C0E8)]"][i % 4]}`}
                    style={{ fontSize: 13 + (w.count / cloud[0].count) * 24 }}>{w.word}</button>
                ))}
              </div>
            </Card>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <Card title="Feedback heatmap" hint="Average rating by department and month. Click a cell">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr><th className="p-1 text-left font-medium text-slate-500">Department</th>{heat.cols.map((m) => <th key={m} className="p-1 font-medium text-slate-500">{fmtMonth(m)}</th>)}</tr></thead>
                  <tbody>
                    {heat.grid.map((r) => (
                      <tr key={r.dept}>
                        <td className="whitespace-nowrap p-1 pr-3 text-slate-700">{r.dept}</td>
                        {r.cells.map((c) => (
                          <td key={c.month} className="p-1">
                            <button disabled={c.value === null} onClick={() => setDrill({ kind: "cell", value: { dept: r.dept, month: c.month }, label: `${r.dept}, ${fmtMonth(c.month)}` })}
                              className={`h-10 w-full rounded-md font-medium ${cellClass(c.value)}`}>{c.value ?? "-"}</button>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
            <Card title="Event comparison" hint="Average rating per event. Click a bar">
              {eventData.length === 0 ? <p className="py-16 text-center text-sm text-slate-500">Add an event name when entering feedback to compare events.</p> : (
                <div className="h-64">
                  <ResponsiveContainer>
                    <BarChart data={eventData}>
                      <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="event" tick={{ fill: "#777D91", fontSize: 12 }} /><YAxis domain={[0, 5]} tick={{ fill: "#777D91", fontSize: 12 }} /><Tooltip />
                      <Bar dataKey="avg" name="Average rating" fill={series.indigo} radius={[6, 6, 0, 0]} cursor="pointer"
                        onClick={(d) => setDrill({ kind: "event", value: pick(d, "event"), label: "feedback for " + pick(d, "event") })} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </div>

          {/* Feedback list */}
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-slate-900">{drill ? `Showing ${drill.label} (${shown.length})` : "Latest feedback"}</h2>
              {drill && <button onClick={() => setDrill(null)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">Clear selection</button>}
            </div>
            <div className="mt-4 divide-y divide-slate-100">
              {shown.length === 0 && <p className="py-8 text-center text-sm text-slate-500">Nothing matches.</p>}
              {shown.map((r) => (
                <div key={r.id} className="py-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="font-semibold text-slate-900">{r.rating} / 5</span>
                    <span className={`rounded-full px-2 py-0.5 font-medium ring-1 ring-inset ${SENT_BADGE[sentOf(r)]}`}>{sentOf(r)}</span>
                    {r.event && <span>{r.event}</span>}
                    {r.department && <span>{r.department}</span>}
                    <span>{new Date(r.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-800">{r.comment}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={() => setFormOpen(false)}>
          <form onSubmit={handleSave} onClick={(e) => e.stopPropagation()} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900">Add feedback</h2>
            <div className="mt-5 grid gap-4">
              <label className="text-sm font-medium text-slate-700">Event (optional)
                <input list="events-list" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="For example Annual Day" value={form.event} onChange={(e) => setForm({ ...form, event: e.target.value })} />
                <datalist id="events-list">{events.map((x) => <option key={x} value={x} />)}</datalist>
              </label>
              <label className="text-sm font-medium text-slate-700">Department
                <select className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>
                  {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
                </select>
              </label>
              <label className="text-sm font-medium text-slate-700">Rating
                <select className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })}>
                  {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} stars</option>)}
                </select>
              </label>
              <label className="text-sm font-medium text-slate-700">Comment
                <textarea rows={4} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} />
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setFormOpen(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
              <button type="submit" disabled={saving} className="rounded-lg bg-[var(--primary,#A29BEA)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--primary-hover,#8F87DC)] disabled:opacity-60">{saving ? "Saving..." : "Save feedback"}</button>
            </div>
          </form>
        </div>
      )}

      {toast && <div role="status" className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg px-4 py-2.5 text-sm text-white shadow-lg ${toast.type === "error" ? "bg-rose-700" : "bg-slate-900"}`}>{toast.text}</div>}
    </div>
  )
}
