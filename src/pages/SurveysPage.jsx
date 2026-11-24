import { useEffect, useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { supabase } from "../utils/supabaseClient"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

const TYPE_LABEL = { rating: "Star rating", choice: "Multiple choice", text: "Text answer" }
const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0)
const fmt = (iso) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
const inputClass = "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-violet-600"
const newQuestion = () => ({ type: "rating", text: "", options: "" })

function Toast({ toast }) {
  if (!toast) return null
  return <div role="status" className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg px-4 py-2.5 text-sm text-white shadow-lg ${toast.type === "error" ? "bg-rose-700" : "bg-slate-900"}`}>{toast.text}</div>
}

function useToast() {
  const [toast, setToast] = useState(null)
  function showToast(text, type = "ok") {
    setToast({ text, type })
    setTimeout(() => setToast(null), 3000)
  }
  return [toast, showToast]
}

/* ---------- Results popup ---------- */
function ResultsModal({ survey, onClose }) {
  const [rows, setRows] = useState(null)
  const [error, setError] = useState("")

  useEffect(() => {
    supabase.from("feedback_responses").select("*").eq("survey_id", survey.id).order("created_at", { ascending: false }).then(({ data, error: e }) => {
      if (e) setError(e.message)
      else setRows(data)
    })
  }, [survey.id])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-slate-900">{survey.title}: results</h2>
        {error && <p className="mt-4 text-sm text-rose-700">Could not load responses: {error}</p>}
        {!rows && !error && <p className="mt-4 text-sm text-slate-500">Loading...</p>}
        {rows && (
          <>
            <p className="mt-1 text-sm text-slate-500">{rows.length} {rows.length === 1 ? "response" : "responses"}{rows.some((r) => r.avg_rating) ? ` · average rating ${avg(rows.filter((r) => r.avg_rating).map((r) => Number(r.avg_rating))).toFixed(1)} / 5` : ""}</p>
            {rows.length === 0 && <p className="mt-6 text-sm text-slate-500">No one has responded yet. Share the survey link to collect answers.</p>}
            {rows.length > 0 && survey.questions.map((q) => {
              const answers = rows.map((r) => r.answers?.[q.id]).filter((a) => a !== undefined && a !== null && a !== "")
              return (
                <div key={q.id} className="mt-6 border-t border-slate-100 pt-4">
                  <p className="text-sm font-medium text-slate-900">{q.text} <span className="font-normal text-slate-500">({TYPE_LABEL[q.type]}, {answers.length} answers)</span></p>
                  {q.type === "rating" && (
                    <>
                      <p className="mt-1 text-sm text-slate-600">Average: {answers.length ? avg(answers.map(Number)).toFixed(1) : "-"} / 5</p>
                      <div className="mt-2 h-40">
                        <ResponsiveContainer><BarChart data={[1, 2, 3, 4, 5].map((n) => ({ label: n + "★", count: answers.filter((a) => Number(a) === n).length }))}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="label" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="count" name="Responses" fill="#7c3aed" radius={[6, 6, 0, 0]} />
                        </BarChart></ResponsiveContainer>
                      </div>
                    </>
                  )}
                  {q.type === "choice" && (
                    <div className="mt-2 h-40">
                      <ResponsiveContainer><BarChart data={(q.options || []).map((o) => ({ label: o, count: answers.filter((a) => a === o).length }))}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="label" interval={0} tick={{ fontSize: 12 }} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="count" name="Responses" fill="#6366f1" radius={[6, 6, 0, 0]} />
                      </BarChart></ResponsiveContainer>
                    </div>
                  )}
                  {q.type === "text" && (
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                      {answers.length === 0 && <li className="list-none text-slate-500">No written answers.</li>}
                      {answers.map((a, i) => <li key={i}>{a}</li>)}
                    </ul>
                  )}
                </div>
              )
            })}
          </>
        )}
        <div className="mt-6 flex justify-end"><button onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Close</button></div>
      </div>
    </div>
  )
}

/* ---------- Survey list + builder ---------- */
function SurveyList() {
  const [surveys, setSurveys] = useState([])
  const [responses, setResponses] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [builderOpen, setBuilderOpen] = useState(false)
  const [draft, setDraft] = useState({ title: "", description: "", event: "", questions: [newQuestion()] })
  const [saving, setSaving] = useState(false)
  const [resultsFor, setResultsFor] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [toast, showToast] = useToast()

  async function load() {
    const [s, r] = await Promise.all([
      supabase.from("feedback_surveys").select("*").order("created_at", { ascending: false }),
      supabase.from("feedback_responses").select("survey_id, avg_rating"),
    ])
    if (s.error) setLoadError(s.error.message)
    else { setLoadError(""); setSurveys(s.data) }
    if (r.data) setResponses(r.data)
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const stats = useMemo(() => {
    const rated = responses.filter((r) => r.avg_rating)
    return [
      ["Surveys", surveys.length],
      ["Active surveys", surveys.filter((s) => s.is_active).length],
      ["Total responses", responses.length],
      ["Average rating", rated.length ? avg(rated.map((r) => Number(r.avg_rating))).toFixed(1) + " / 5" : "-"],
    ]
  }, [surveys, responses])

  function updateQuestion(i, patch) {
    setDraft({ ...draft, questions: draft.questions.map((q, idx) => (idx === i ? { ...q, ...patch } : q)) })
  }

  async function saveSurvey(e) {
    e.preventDefault()
    if (!draft.title.trim()) return showToast("Enter a survey title.", "error")
    if (draft.questions.length === 0) return showToast("Add at least one question.", "error")
    const questions = []
    for (let i = 0; i < draft.questions.length; i++) {
      const q = draft.questions[i]
      if (!q.text.trim()) return showToast(`Question ${i + 1} needs some text.`, "error")
      const item = { id: `q${i + 1}`, type: q.type, text: q.text.trim() }
      if (q.type === "choice") {
        const options = q.options.split(",").map((o) => o.trim()).filter(Boolean)
        if (options.length < 2) return showToast(`Question ${i + 1} needs at least 2 options, separated by commas.`, "error")
        item.options = options
      }
      questions.push(item)
    }
    setSaving(true)
    const { error } = await supabase.from("feedback_surveys").insert({
      title: draft.title.trim(), description: draft.description.trim() || null, event: draft.event.trim() || null, questions, is_active: true,
    })
    setSaving(false)
    if (error) return showToast("Could not save: " + error.message, "error")
    showToast("Survey created")
    setBuilderOpen(false)
    setDraft({ title: "", description: "", event: "", questions: [newQuestion()] })
    load()
  }

  async function toggleActive(s) {
    const { error } = await supabase.from("feedback_surveys").update({ is_active: !s.is_active }).eq("id", s.id)
    if (error) return showToast("Could not update: " + error.message, "error")
    load()
  }

  async function copyLink(s) {
    const link = `${window.location.origin}/surveys/${s.id}`
    try {
      await navigator.clipboard.writeText(link)
      showToast("Survey link copied")
    } catch {
      window.prompt("Copy this survey link:", link)
    }
  }

  async function confirmDelete() {
    const { error } = await supabase.from("feedback_surveys").delete().eq("id", deleteTarget.id)
    if (error) return showToast("Could not delete: " + error.message, "error")
    setDeleteTarget(null)
    showToast("Survey deleted")
    load()
  }

  const countFor = (id) => responses.filter((r) => r.survey_id === id).length
  const avgFor = (id) => {
    const rated = responses.filter((r) => r.survey_id === id && r.avg_rating)
    return rated.length ? avg(rated.map((r) => Number(r.avg_rating))).toFixed(1) : "-"
  }

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Feedback surveys</h1>
          <p className="mt-1 text-sm text-slate-500">Create a survey, share the link, and see the results here.</p>
        </div>
        <div className="flex gap-3">
          <Link to="/feedback" className="rounded-lg border border-violet-300 bg-white px-4 py-2.5 text-sm font-medium text-violet-700 hover:bg-violet-50">Back to feedback</Link>
          <button onClick={() => setBuilderOpen(true)} className="rounded-lg bg-violet-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-800">Create survey</button>
        </div>
      </div>

      {loadError && <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">Could not load surveys: {loadError}</div>}

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{loading ? "-" : value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
            <tr><th className="px-5 py-3 font-medium">Survey</th><th className="px-5 py-3 font-medium">Questions</th><th className="px-5 py-3 font-medium">Responses</th><th className="px-5 py-3 font-medium">Avg rating</th><th className="px-5 py-3 font-medium">Status</th><th className="px-5 py-3 text-right font-medium">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {surveys.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50/70">
                <td className="px-5 py-3"><p className="font-medium text-slate-900">{s.title}</p><p className="text-xs text-slate-500">{[s.event, fmt(s.created_at)].filter(Boolean).join(" · ")}</p></td>
                <td className="px-5 py-3 text-slate-700">{s.questions?.length || 0}</td>
                <td className="px-5 py-3 text-slate-700">{countFor(s.id)}</td>
                <td className="px-5 py-3 text-slate-700">{avgFor(s.id)}</td>
                <td className="px-5 py-3"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${s.is_active ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20" : "bg-slate-100 text-slate-600 ring-slate-500/20"}`}>{s.is_active ? "Active" : "Closed"}</span></td>
                <td className="whitespace-nowrap px-5 py-3 text-right">
                  <button onClick={() => setResultsFor(s)} className="rounded-md px-2.5 py-1.5 text-sm font-medium text-violet-700 hover:bg-violet-50">Results</button>
                  <Link to={`/surveys/${s.id}`} className="rounded-md px-2.5 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100">Respond</Link>
                  <button onClick={() => copyLink(s)} className="rounded-md px-2.5 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100">Copy link</button>
                  <button onClick={() => toggleActive(s)} className="rounded-md px-2.5 py-1.5 text-sm font-medium text-amber-700 hover:bg-amber-50">{s.is_active ? "Close" : "Reopen"}</button>
                  <button onClick={() => setDeleteTarget(s)} className="rounded-md px-2.5 py-1.5 text-sm font-medium text-rose-600 hover:bg-rose-50">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <p className="px-5 py-14 text-center text-sm text-slate-500">Loading surveys...</p>}
        {!loading && surveys.length === 0 && <div className="px-5 py-14 text-center"><p className="font-medium text-slate-900">No surveys yet</p><p className="mt-1 text-sm text-slate-500">Click Create survey to build the first one.</p></div>}
      </div>

      {builderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={() => setBuilderOpen(false)}>
          <form onSubmit={saveSurvey} onClick={(e) => e.stopPropagation()} className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900">Create survey</h2>
            <div className="mt-5 grid gap-4">
              <label className="text-sm font-medium text-slate-700">Survey title
                <input className={inputClass} placeholder="For example Annual Day Feedback" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
              </label>
              <label className="text-sm font-medium text-slate-700">Description (optional)
                <input className={inputClass} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
              </label>
              <label className="text-sm font-medium text-slate-700">Event name (optional)
                <input className={inputClass} placeholder="For example Annual Day" value={draft.event} onChange={(e) => setDraft({ ...draft, event: e.target.value })} />
              </label>
            </div>
            <h3 className="mt-6 text-sm font-semibold text-slate-900">Questions</h3>
            {draft.questions.map((q, i) => (
              <div key={i} className="mt-3 rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-slate-700">Question {i + 1}</p>
                  {draft.questions.length > 1 && <button type="button" onClick={() => setDraft({ ...draft, questions: draft.questions.filter((_, idx) => idx !== i) })} className="text-sm font-medium text-rose-600 hover:underline">Remove</button>}
                </div>
                <label className="mt-2 block text-sm font-medium text-slate-700">Type
                  <select className={inputClass} value={q.type} onChange={(e) => updateQuestion(i, { type: e.target.value })}>
                    {Object.entries(TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </label>
                <label className="mt-2 block text-sm font-medium text-slate-700">Question text
                  <input className={inputClass} value={q.text} onChange={(e) => updateQuestion(i, { text: e.target.value })} />
                </label>
                {q.type === "choice" && (
                  <label className="mt-2 block text-sm font-medium text-slate-700">Options (separate with commas)
                    <input className={inputClass} placeholder="Food, Games, Music" value={q.options} onChange={(e) => updateQuestion(i, { options: e.target.value })} />
                  </label>
                )}
              </div>
            ))}
            <button type="button" onClick={() => setDraft({ ...draft, questions: [...draft.questions, newQuestion()] })} className="mt-3 rounded-lg border border-violet-300 px-3 py-2 text-sm font-medium text-violet-700 hover:bg-violet-50">Add question</button>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setBuilderOpen(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
              <button type="submit" disabled={saving} className="rounded-lg bg-violet-700 px-4 py-2 text-sm font-medium text-white hover:bg-violet-800 disabled:opacity-60">{saving ? "Saving..." : "Save survey"}</button>
            </div>
          </form>
        </div>
      )}

      {resultsFor && <ResultsModal survey={resultsFor} onClose={() => setResultsFor(null)} />}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={() => setDeleteTarget(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900">Delete "{deleteTarget.title}"?</h2>
            <p className="mt-2 text-sm text-slate-600">This also deletes every response to it. You can't undo this.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setDeleteTarget(null)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Keep survey</button>
              <button onClick={confirmDelete} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700">Delete survey</button>
            </div>
          </div>
        </div>
      )}

      <Toast toast={toast} />
    </div>
  )
}

/* ---------- Response page ---------- */
function RespondView({ surveyId }) {
  const [survey, setSurvey] = useState(null)
  const [state, setState] = useState("loading")
  const [answers, setAnswers] = useState({})
  const [saving, setSaving] = useState(false)
  const [toast, showToast] = useToast()

  useEffect(() => {
    supabase.from("feedback_surveys").select("*").eq("id", surveyId).maybeSingle().then(({ data, error }) => {
      if (error || !data) setState("missing")
      else if (!data.is_active) { setSurvey(data); setState("closed") }
      else { setSurvey(data); setState("ready") }
    })
  }, [surveyId])

  async function submit(e) {
    e.preventDefault()
    for (const q of survey.questions) {
      if (q.type !== "text" && (answers[q.id] === undefined || answers[q.id] === "")) return showToast(`Please answer: ${q.text}`, "error")
    }
    const ratings = survey.questions.filter((q) => q.type === "rating").map((q) => Number(answers[q.id]))
    setSaving(true)
    const { error } = await supabase.from("feedback_responses").insert({
      survey_id: survey.id, answers, avg_rating: ratings.length ? Number(avg(ratings).toFixed(2)) : null,
    })
    setSaving(false)
    if (error) return showToast("Could not submit: " + error.message, "error")
    setState("done")
  }

  return (
    <div className="mx-auto max-w-2xl p-4 sm:p-8">
      {state === "loading" && <p className="text-sm text-slate-500">Loading survey...</p>}
      {state === "missing" && <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center"><p className="font-medium text-slate-900">Survey not found</p><p className="mt-1 text-sm text-slate-500">The link may be wrong, or the survey was deleted.</p><Link to="/surveys" className="mt-4 inline-block text-sm font-medium text-violet-700">Back to surveys</Link></div>}
      {state === "closed" && <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center"><p className="font-medium text-slate-900">This survey is closed</p><p className="mt-1 text-sm text-slate-500">{survey.title} is no longer taking responses.</p></div>}
      {state === "done" && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center"><p className="text-lg font-semibold text-emerald-900">Thank you!</p><p className="mt-1 text-sm text-emerald-800">Your response has been recorded.</p><Link to="/surveys" className="mt-4 inline-block text-sm font-medium text-violet-700">Back to surveys</Link></div>}
      {state === "ready" && (
        <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-6">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{survey.title}</h1>
          {survey.description && <p className="mt-1 text-sm text-slate-500">{survey.description}</p>}
          {survey.questions.map((q, i) => (
            <div key={q.id} className="mt-6">
              <p className="text-sm font-medium text-slate-900">{i + 1}. {q.text}{q.type === "text" && <span className="font-normal text-slate-500"> (optional)</span>}</p>
              {q.type === "rating" && (
                <div className="mt-2 flex gap-2" role="radiogroup" aria-label={q.text}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} type="button" role="radio" aria-checked={answers[q.id] === n} aria-label={`${n} stars`} onClick={() => setAnswers({ ...answers, [q.id]: n })}
                      className={`h-11 w-11 rounded-lg border text-lg ${answers[q.id] >= n ? "border-amber-400 bg-amber-50 text-amber-600" : "border-slate-300 text-slate-400 hover:bg-slate-50"}`}>★</button>
                  ))}
                </div>
              )}
              {q.type === "choice" && (
                <div className="mt-2 grid gap-2">
                  {q.options.map((o) => (
                    <label key={o} className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm ${answers[q.id] === o ? "border-violet-600 bg-violet-50" : "border-slate-300 hover:bg-slate-50"}`}>
                      <input type="radio" name={q.id} checked={answers[q.id] === o} onChange={() => setAnswers({ ...answers, [q.id]: o })} className="accent-violet-700" />{o}
                    </label>
                  ))}
                </div>
              )}
              {q.type === "text" && <textarea rows={3} className={inputClass} value={answers[q.id] || ""} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })} />}
            </div>
          ))}
          <div className="mt-8 flex justify-end">
            <button type="submit" disabled={saving} className="rounded-lg bg-violet-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-violet-800 disabled:opacity-60">{saving ? "Submitting..." : "Submit response"}</button>
          </div>
        </form>
      )}
      <Toast toast={toast} />
    </div>
  )
}

export default function SurveysPage() {
  const { id } = useParams()
  return id ? <RespondView surveyId={id} /> : <SurveyList />
}
