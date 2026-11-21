import { useEffect, useState } from "react"
import { supabase } from "../utils/supabaseClient"

const DEPARTMENTS = ["Engineering", "Human Resources", "Marketing", "Sales", "Finance", "Operations"]
const JOB_TYPES = ["Full-time", "Part-time", "Internship", "Contract"]
const APP_STATUSES = ["Applied", "Shortlisted", "Interview Scheduled", "Selected", "Rejected"]
const MODES = ["Online", "In person", "Phone"]
const RESULTS = ["Pending", "Passed", "Failed"]

const STATUS_STYLES = {
  Applied: "bg-sky-50 text-sky-700 ring-sky-600/20",
  Shortlisted: "bg-violet-50 text-violet-700 ring-violet-600/20",
  "Interview Scheduled": "bg-amber-50 text-amber-700 ring-amber-600/20",
  Selected: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  Rejected: "bg-rose-50 text-rose-700 ring-rose-600/20",
  Open: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  Closed: "bg-slate-100 text-slate-600 ring-slate-500/20",
  Pending: "bg-amber-50 text-amber-700 ring-amber-600/20",
  Passed: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  Failed: "bg-rose-50 text-rose-700 ring-rose-600/20",
}

const DEFAULT_FORMS = {
  job: { title: "", department: DEPARTMENTS[0], location: "", job_type: JOB_TYPES[0], openings: "1", description: "" },
  candidate: { full_name: "", email: "", phone: "", experience_years: "", skills: "" },
  application: { job_id: "", candidate_id: "" },
  interview: { application_id: "", interview_date: "", interview_time: "", mode: MODES[0], interviewer: "" },
  result: { result: "Pending", feedback: "" },
}

const INPUT = "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/30"

function formatDate(iso) {
  if (!iso) return "-"
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
}

const experienceText = (years) => (Number(years) > 0 ? `${years} years` : "Fresher")

function friendlyError(error) {
  if (error.code === "23505") return "That already exists (a repeated email or application)."
  return "Something went wrong: " + error.message
}

function Badge({ value }) {
  return <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${STATUS_STYLES[value]}`}>{value}</span>
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        {children}
      </div>
    </div>
  )
}

function Field({ label, error, children }) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      {children}
      {error && <span className="mt-1 block text-xs font-normal text-rose-600">{error}</span>}
    </label>
  )
}

function FormButtons({ onCancel, label, saving }) {
  return (
    <div className="mt-6 flex justify-end gap-3">
      <button type="button" onClick={onCancel} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
      <button type="submit" disabled={saving} className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60">
        {saving ? "Saving..." : label}
      </button>
    </div>
  )
}

function Table({ headers, children, empty }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full min-w-[800px] text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
          <tr>{headers.map((h, i) => <th key={h} className={`px-5 py-3 font-medium ${i === headers.length - 1 ? "text-right" : ""}`}>{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
      {empty && <p className="px-5 py-12 text-center text-sm text-slate-500">{empty}</p>}
    </div>
  )
}

const linkBtn = "rounded-md px-2.5 py-1.5 text-sm font-medium hover:bg-slate-100"

export default function RecruitmentManagement() {
  const [tab, setTab] = useState("Jobs")
  const [jobs, setJobs] = useState([])
  const [candidates, setCandidates] = useState([])
  const [applications, setApplications] = useState([])
  const [interviews, setInterviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [saving, setSaving] = useState(false)
  const [appFilter, setAppFilter] = useState("All")

  const [modal, setModal] = useState(null) // { kind, id }
  const [form, setForm] = useState({})
  const [errors, setErrors] = useState({})
  const [viewCandidate, setViewCandidate] = useState(null)
  const [toast, setToast] = useState(null)

  // ----- Load everything from Supabase -----
  async function loadAll() {
    const results = await Promise.all([
      supabase.from("jobs").select("*").order("posted_date", { ascending: false }),
      supabase.from("candidates").select("*").order("full_name"),
      supabase.from("applications").select("*").order("applied_date", { ascending: false }),
      supabase.from("interviews").select("*").order("interview_date", { ascending: false }),
    ])
    const failed = results.find((r) => r.error)
    if (failed) setLoadError(failed.error.message)
    else {
      setLoadError("")
      setJobs(results[0].data)
      setCandidates(results[1].data)
      setApplications(results[2].data)
      setInterviews(results[3].data)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadAll()
  }, [])

  const jobById = (id) => jobs.find((j) => j.id === id)
  const candById = (id) => candidates.find((c) => c.id === id)
  const appById = (id) => applications.find((a) => a.id === id)
  const appLabel = (a) => (a ? `${candById(a.candidate_id)?.full_name} for ${jobById(a.job_id)?.title}` : "")

  // ----- Statistics -----
  const stats = [
    { label: "Open jobs", value: jobs.filter((j) => j.status === "Open").length },
    { label: "Candidates", value: candidates.length },
    { label: "Applications", value: applications.length },
    { label: "Interviews waiting for a result", value: interviews.filter((i) => i.result === "Pending").length },
  ]

  function showToast(text, type = "ok") {
    setToast({ text, type })
    setTimeout(() => setToast(null), 3000)
  }

  // Runs one database action, shows a message, then reloads the data
  async function run(query, successMessage) {
    setSaving(true)
    const { error } = await query
    setSaving(false)
    if (error) {
      showToast(friendlyError(error), "error")
      return false
    }
    showToast(successMessage)
    await loadAll()
    return true
  }

  function openModal(kind, item, prefill) {
    let values
    if (item) {
      values = Object.fromEntries(Object.entries(item).map(([k, v]) => [k, v ?? ""]))
      if (values.interview_time) values.interview_time = String(values.interview_time).slice(0, 5)
    } else {
      values = { ...DEFAULT_FORMS[kind], ...prefill }
    }
    setForm(values)
    setModal({ kind, id: item ? item.id : null })
    setErrors({})
  }

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  function validate() {
    const e = {}
    const k = modal.kind
    if (k === "job") {
      if (!form.title.trim()) e.title = "Enter a job title."
      if (!form.location.trim()) e.location = "Enter a location."
      if (!(Number(form.openings) >= 1)) e.openings = "Enter 1 or more openings."
    }
    if (k === "candidate") {
      if (!form.full_name.trim()) e.full_name = "Enter the candidate's full name."
      if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Enter a valid email, like name@gmail.com."
      if (!/^\d{10}$/.test(form.phone)) e.phone = "Enter a 10-digit phone number."
      if (form.experience_years !== "" && (isNaN(Number(form.experience_years)) || Number(form.experience_years) < 0)) e.experience_years = "Enter years as a number, like 2."
    }
    if (k === "application") {
      if (!form.job_id) e.job_id = "Pick a job."
      if (!form.candidate_id) e.candidate_id = "Pick a candidate."
      if (form.job_id && form.candidate_id && applications.some((a) => a.job_id === form.job_id && a.candidate_id === form.candidate_id))
        e.candidate_id = "This candidate has already applied for this job."
    }
    if (k === "interview") {
      if (!form.application_id) e.application_id = "Pick an application."
      if (!form.interview_date) e.interview_date = "Pick an interview date."
      if (!form.interview_time) e.interview_time = "Pick a time."
      if (!form.interviewer.trim()) e.interviewer = "Enter the interviewer's name."
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function save(event) {
    event.preventDefault()
    if (!validate()) return
    const { kind, id } = modal
    let ok = false

    if (kind === "job") {
      const payload = {
        title: form.title.trim(), department: form.department, location: form.location.trim(),
        job_type: form.job_type, openings: Number(form.openings), description: form.description,
      }
      ok = await run(
        id === null ? supabase.from("jobs").insert(payload) : supabase.from("jobs").update(payload).eq("id", id),
        id === null ? "Job opening created" : "Job opening updated"
      )
    }
    if (kind === "candidate") {
      const payload = {
        full_name: form.full_name.trim(), email: form.email.trim(), phone: form.phone,
        experience_years: form.experience_years === "" ? null : Number(form.experience_years), skills: form.skills,
      }
      ok = await run(
        id === null ? supabase.from("candidates").insert(payload) : supabase.from("candidates").update(payload).eq("id", id),
        id === null ? "Candidate added" : "Candidate updated"
      )
    }
    if (kind === "application") {
      ok = await run(supabase.from("applications").insert({ job_id: form.job_id, candidate_id: form.candidate_id }), "Application added")
      if (ok) setTab("Applications")
    }
    if (kind === "interview") {
      const payload = {
        application_id: form.application_id, interview_date: form.interview_date, interview_time: form.interview_time,
        mode: form.mode, interviewer: form.interviewer.trim(),
      }
      ok = await run(
        id === null ? supabase.from("interviews").insert(payload) : supabase.from("interviews").update(payload).eq("id", id),
        id === null ? "Interview scheduled" : "Interview updated"
      )
      if (ok && id === null) {
        await supabase.from("applications").update({ status: "Interview Scheduled" }).eq("id", payload.application_id)
        await loadAll()
      }
      if (ok) setTab("Interviews")
    }
    if (kind === "result") {
      ok = await run(supabase.from("interviews").update({ result: form.result, feedback: form.feedback }).eq("id", id), "Interview result saved")
    }
    if (ok) setModal(null)
  }

  function toggleJob(job) {
    run(supabase.from("jobs").update({ status: job.status === "Open" ? "Closed" : "Open" }).eq("id", job.id), job.status === "Open" ? "Job closed" : "Job reopened")
  }

  function changeStatus(appId, status) {
    run(supabase.from("applications").update({ status }).eq("id", appId), "Application status updated")
  }

  const shownApps = applications.filter((a) => appFilter === "All" || a.status === appFilter)
  const tabs = ["Jobs", "Candidates", "Applications", "Interviews"]
  const addLabel = { Jobs: ["job", "Create job opening"], Candidates: ["candidate", "Add candidate"], Applications: ["application", "Add application"], Interviews: ["interview", "Schedule interview"] }[tab]
  const emptyText = (list, text) => (!loading && list.length === 0 ? text : "")

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Recruitment</h1>
          <p className="mt-1 text-sm text-slate-500">Post jobs, track candidates and manage interviews in one place.</p>
        </div>
        <button onClick={() => openModal(addLabel[0])} className="rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-teal-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2">
          {addLabel[1]}
        </button>
      </div>

      {loadError && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <span>Could not load recruitment data: {loadError}</span>
          <button onClick={loadAll} className="rounded-lg border border-rose-300 bg-white px-3 py-1.5 font-medium hover:bg-rose-100">Try again</button>
        </div>
      )}

      {/* Statistics */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">{s.label}</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{loading ? "-" : s.value}</p>
          </div>
        ))}
      </div>

      {/* Applications by status */}
      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5">
        <p className="text-sm font-medium text-slate-900">Applications by status</p>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {APP_STATUSES.map((s) => (
            <div key={s} className="rounded-lg bg-slate-50 px-3 py-2.5">
              <p className="text-xl font-semibold text-slate-900">{loading ? "-" : applications.filter((a) => a.status === s).length}</p>
              <p className="text-xs text-slate-500">{s}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex gap-1 overflow-x-auto border-b border-slate-200">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium ${tab === t ? "border-teal-700 text-teal-800" : "border-transparent text-slate-500 hover:text-slate-800"}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {loading && <p className="rounded-xl border border-slate-200 bg-white px-5 py-14 text-center text-sm text-slate-500">Loading recruitment data...</p>}

        {/* ---------- JOBS ---------- */}
        {!loading && tab === "Jobs" && (
          <Table headers={["Job", "Department", "Location", "Openings", "Applicants", "Posted", "Status", "Actions"]} empty={emptyText(jobs, "No job openings yet. Click Create job opening to add one.")}>
            {jobs.map((j) => (
              <tr key={j.id} className="hover:bg-slate-50/70">
                <td className="px-5 py-3"><p className="font-medium text-slate-900">{j.title}</p><p className="text-xs text-slate-500">{j.job_type}</p></td>
                <td className="px-5 py-3 text-slate-700">{j.department}</td>
                <td className="px-5 py-3 text-slate-700">{j.location}</td>
                <td className="px-5 py-3 text-slate-700">{j.openings}</td>
                <td className="px-5 py-3 text-slate-700">{applications.filter((a) => a.job_id === j.id).length}</td>
                <td className="px-5 py-3 text-slate-700">{formatDate(j.posted_date)}</td>
                <td className="px-5 py-3"><Badge value={j.status} /></td>
                <td className="whitespace-nowrap px-5 py-3 text-right">
                  <button onClick={() => openModal("job", j)} className={`${linkBtn} text-teal-700`}>Edit</button>
                  <button onClick={() => toggleJob(j)} className={`${linkBtn} ${j.status === "Open" ? "text-rose-600" : "text-slate-700"}`}>{j.status === "Open" ? "Close" : "Reopen"}</button>
                </td>
              </tr>
            ))}
          </Table>
        )}

        {/* ---------- CANDIDATES ---------- */}
        {!loading && tab === "Candidates" && (
          <Table headers={["Candidate", "Phone", "Experience", "Skills", "Applications", "Actions"]} empty={emptyText(candidates, "No candidates yet. Click Add candidate to add one.")}>
            {candidates.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50/70">
                <td className="px-5 py-3"><p className="font-medium text-slate-900">{c.full_name}</p><p className="text-xs text-slate-500">{c.email}</p></td>
                <td className="px-5 py-3 text-slate-700">{c.phone}</td>
                <td className="px-5 py-3 text-slate-700">{experienceText(c.experience_years)}</td>
                <td className="px-5 py-3 text-slate-700">{c.skills || "-"}</td>
                <td className="px-5 py-3 text-slate-700">{applications.filter((a) => a.candidate_id === c.id).length}</td>
                <td className="whitespace-nowrap px-5 py-3 text-right">
                  <button onClick={() => setViewCandidate(c)} className={`${linkBtn} text-slate-700`}>View</button>
                  <button onClick={() => openModal("candidate", c)} className={`${linkBtn} text-teal-700`}>Edit</button>
                  <button onClick={() => openModal("application", null, { candidate_id: c.id })} className={`${linkBtn} text-indigo-700`}>Apply to job</button>
                </td>
              </tr>
            ))}
          </Table>
        )}

        {/* ---------- APPLICATIONS ---------- */}
        {!loading && tab === "Applications" && (
          <>
            <div className="mb-3">
              <select value={appFilter} onChange={(e) => setAppFilter(e.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-teal-600" aria-label="Filter by status">
                <option value="All">All statuses</option>
                {APP_STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <Table headers={["Candidate", "Job", "Applied on", "Status", "Actions"]} empty={emptyText(shownApps, "No applications match this status.")}>
              {shownApps.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50/70">
                  <td className="px-5 py-3 font-medium text-slate-900">{candById(a.candidate_id)?.full_name}</td>
                  <td className="px-5 py-3 text-slate-700">{jobById(a.job_id)?.title}</td>
                  <td className="px-5 py-3 text-slate-700">{formatDate(a.applied_date)}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <Badge value={a.status} />
                      <select value={a.status} onChange={(e) => changeStatus(a.id, e.target.value)} className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs outline-none focus:border-teal-600" aria-label="Change status">
                        {APP_STATUSES.map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-right">
                    <button onClick={() => openModal("interview", null, { application_id: a.id })} className={`${linkBtn} text-teal-700`}>Schedule interview</button>
                  </td>
                </tr>
              ))}
            </Table>
          </>
        )}

        {/* ---------- INTERVIEWS ---------- */}
        {!loading && tab === "Interviews" && (
          <Table headers={["Candidate", "Job", "Date and time", "Mode", "Interviewer", "Result", "Actions"]} empty={emptyText(interviews, "No interviews scheduled yet.")}>
            {interviews.map((i) => {
              const a = appById(i.application_id)
              return (
                <tr key={i.id} className="hover:bg-slate-50/70">
                  <td className="px-5 py-3 font-medium text-slate-900">{candById(a?.candidate_id)?.full_name}</td>
                  <td className="px-5 py-3 text-slate-700">{jobById(a?.job_id)?.title}</td>
                  <td className="px-5 py-3 text-slate-700">{formatDate(i.interview_date)}, {String(i.interview_time).slice(0, 5)}</td>
                  <td className="px-5 py-3 text-slate-700">{i.mode}</td>
                  <td className="px-5 py-3 text-slate-700">{i.interviewer}</td>
                  <td className="px-5 py-3"><Badge value={i.result} /></td>
                  <td className="whitespace-nowrap px-5 py-3 text-right">
                    <button onClick={() => openModal("interview", i)} className={`${linkBtn} text-slate-700`}>Edit</button>
                    <button onClick={() => openModal("result", i)} className={`${linkBtn} text-teal-700`}>Record result</button>
                  </td>
                </tr>
              )
            })}
          </Table>
        )}
      </div>

      {/* ---------- POPUPS ---------- */}
      {modal?.kind === "job" && (
        <Modal title={modal.id === null ? "Create job opening" : "Edit job opening"} onClose={() => setModal(null)}>
          <form onSubmit={save} noValidate className="mt-5 space-y-4">
            <Field label="Job title" error={errors.title}><input className={INPUT} value={form.title} onChange={set("title")} /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Department"><select className={INPUT} value={form.department} onChange={set("department")}>{DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}</select></Field>
              <Field label="Job type"><select className={INPUT} value={form.job_type} onChange={set("job_type")}>{JOB_TYPES.map((t) => <option key={t}>{t}</option>)}</select></Field>
              <Field label="Location" error={errors.location}><input className={INPUT} value={form.location} onChange={set("location")} /></Field>
              <Field label="Number of openings" error={errors.openings}><input inputMode="numeric" className={INPUT} value={form.openings} onChange={set("openings")} /></Field>
            </div>
            <Field label="Description"><textarea rows={3} className={INPUT} value={form.description} onChange={set("description")} /></Field>
            <FormButtons saving={saving} onCancel={() => setModal(null)} label={modal.id === null ? "Create job opening" : "Save changes"} />
          </form>
        </Modal>
      )}

      {modal?.kind === "candidate" && (
        <Modal title={modal.id === null ? "Add candidate" : "Edit candidate"} onClose={() => setModal(null)}>
          <form onSubmit={save} noValidate className="mt-5 space-y-4">
            <Field label="Full name" error={errors.full_name}><input className={INPUT} value={form.full_name} onChange={set("full_name")} /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Email" error={errors.email}><input type="email" className={INPUT} value={form.email} onChange={set("email")} /></Field>
              <Field label="Phone" error={errors.phone}><input className={INPUT} value={form.phone} onChange={set("phone")} /></Field>
            </div>
            <Field label="Years of experience (leave empty for a fresher)" error={errors.experience_years}><input inputMode="numeric" className={INPUT} value={form.experience_years} onChange={set("experience_years")} /></Field>
            <Field label="Skills (separate with commas)"><input className={INPUT} value={form.skills} onChange={set("skills")} /></Field>
            <FormButtons saving={saving} onCancel={() => setModal(null)} label={modal.id === null ? "Add candidate" : "Save changes"} />
          </form>
        </Modal>
      )}

      {modal?.kind === "application" && (
        <Modal title="Add application" onClose={() => setModal(null)}>
          <form onSubmit={save} noValidate className="mt-5 space-y-4">
            <Field label="Candidate" error={errors.candidate_id}>
              <select className={INPUT} value={form.candidate_id} onChange={set("candidate_id")}>
                <option value="">Pick a candidate</option>
                {candidates.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
              </select>
            </Field>
            <Field label="Job (only open jobs are shown)" error={errors.job_id}>
              <select className={INPUT} value={form.job_id} onChange={set("job_id")}>
                <option value="">Pick a job</option>
                {jobs.filter((j) => j.status === "Open").map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
              </select>
            </Field>
            <FormButtons saving={saving} onCancel={() => setModal(null)} label="Add application" />
          </form>
        </Modal>
      )}

      {modal?.kind === "interview" && (
        <Modal title={modal.id === null ? "Schedule interview" : "Edit interview"} onClose={() => setModal(null)}>
          <form onSubmit={save} noValidate className="mt-5 space-y-4">
            <Field label="Application" error={errors.application_id}>
              <select className={INPUT} value={form.application_id} onChange={set("application_id")} disabled={modal.id !== null}>
                <option value="">Pick an application</option>
                {applications.map((a) => <option key={a.id} value={a.id}>{appLabel(a)}</option>)}
              </select>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Date" error={errors.interview_date}><input type="date" className={INPUT} value={form.interview_date} onChange={set("interview_date")} /></Field>
              <Field label="Time" error={errors.interview_time}><input type="time" className={INPUT} value={form.interview_time} onChange={set("interview_time")} /></Field>
              <Field label="Mode"><select className={INPUT} value={form.mode} onChange={set("mode")}>{MODES.map((m) => <option key={m}>{m}</option>)}</select></Field>
              <Field label="Interviewer" error={errors.interviewer}><input className={INPUT} value={form.interviewer} onChange={set("interviewer")} /></Field>
            </div>
            <FormButtons saving={saving} onCancel={() => setModal(null)} label={modal.id === null ? "Schedule interview" : "Save changes"} />
          </form>
        </Modal>
      )}

      {modal?.kind === "result" && (
        <Modal title="Record interview result" onClose={() => setModal(null)}>
          <form onSubmit={save} noValidate className="mt-5 space-y-4">
            <p className="text-sm text-slate-600">{appLabel(appById(interviews.find((i) => i.id === modal.id)?.application_id))}</p>
            <Field label="Result"><select className={INPUT} value={form.result} onChange={set("result")}>{RESULTS.map((r) => <option key={r}>{r}</option>)}</select></Field>
            <Field label="Feedback"><textarea rows={3} className={INPUT} value={form.feedback} onChange={set("feedback")} /></Field>
            <FormButtons saving={saving} onCancel={() => setModal(null)} label="Save result" />
          </form>
        </Modal>
      )}

      {viewCandidate && (
        <Modal title={viewCandidate.full_name} onClose={() => setViewCandidate(null)}>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            {[["Email", viewCandidate.email], ["Phone", viewCandidate.phone], ["Experience", experienceText(viewCandidate.experience_years)], ["Skills", viewCandidate.skills || "-"]].map(([l, v]) => (
              <div key={l}><dt className="text-xs text-slate-500">{l}</dt><dd className="mt-0.5 break-words text-sm font-medium text-slate-900">{v}</dd></div>
            ))}
          </dl>
          <p className="mt-6 text-sm font-medium text-slate-900">Applications</p>
          <div className="mt-2 space-y-2">
            {applications.filter((a) => a.candidate_id === viewCandidate.id).map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5">
                <span className="text-sm text-slate-800">{jobById(a.job_id)?.title}</span>
                <Badge value={a.status} />
              </div>
            ))}
            {applications.filter((a) => a.candidate_id === viewCandidate.id).length === 0 && <p className="text-sm text-slate-500">This candidate has not applied for any job yet.</p>}
          </div>
          <div className="mt-6 flex justify-end">
            <button onClick={() => setViewCandidate(null)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Close</button>
          </div>
        </Modal>
      )}

      {toast && (
        <div className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg px-4 py-2.5 text-sm text-white shadow-lg ${toast.type === "error" ? "bg-rose-700" : "bg-slate-900"}`} role="status">
          {toast.text}
        </div>
      )}
    </div>
  )
}
