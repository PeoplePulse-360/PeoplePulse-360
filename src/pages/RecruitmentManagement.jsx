import { useState } from "react"

// ------------------------------------------------------------------
// TEMPORARY SAMPLE DATA
// This is fake data just so the page has something to show.
// Later we will replace it with real data from Supabase.
// ------------------------------------------------------------------
const DEPARTMENTS = ["Engineering", "Human Resources", "Marketing", "Sales", "Finance", "Operations"]
const JOB_TYPES = ["Full-time", "Part-time", "Internship", "Contract"]
const APP_STATUSES = ["Applied", "Shortlisted", "Interview Scheduled", "Selected", "Rejected"]
const MODES = ["Online", "In person", "Phone"]
const RESULTS = ["Pending", "Passed", "Failed"]

const SAMPLE_JOBS = [
  { id: 1, title: "Frontend Developer", department: "Engineering", location: "Jaipur", type: "Full-time", openings: 2, status: "Open", postedDate: "2026-10-20", description: "Build clean React screens for our HR tools." },
  { id: 2, title: "HR Executive", department: "Human Resources", location: "Remote", type: "Full-time", openings: 1, status: "Open", postedDate: "2026-10-28", description: "Support hiring, onboarding and employee queries." },
  { id: 3, title: "Marketing Intern", department: "Marketing", location: "Delhi", type: "Internship", openings: 3, status: "Open", postedDate: "2026-11-02", description: "Help the team with social media and campaigns." },
  { id: 4, title: "Accountant", department: "Finance", location: "Jaipur", type: "Full-time", openings: 1, status: "Closed", postedDate: "2026-09-10", description: "Manage payroll entries and monthly reports." },
]
const SAMPLE_CANDIDATES = [
  { id: 1, name: "Meera Joshi", email: "meera.joshi@gmail.com", phone: "9900112233", experience: "2", skills: "React, JavaScript, Tailwind" },
  { id: 2, name: "Arjun Rao", email: "arjun.rao@gmail.com", phone: "9900223344", experience: "4", skills: "React, Node.js, SQL" },
  { id: 3, name: "Isha Gupta", email: "isha.gupta@gmail.com", phone: "9900334455", experience: "1", skills: "Recruiting, Communication" },
  { id: 4, name: "Dev Patel", email: "dev.patel@gmail.com", phone: "9900445566", experience: "0", skills: "Social media, Canva" },
  { id: 5, name: "Nisha Reddy", email: "nisha.reddy@gmail.com", phone: "9900556677", experience: "3", skills: "Tally, Excel, GST" },
]
const SAMPLE_APPLICATIONS = [
  { id: 1, jobId: 1, candidateId: 1, status: "Interview Scheduled", appliedDate: "2026-10-25" },
  { id: 2, jobId: 1, candidateId: 2, status: "Shortlisted", appliedDate: "2026-10-27" },
  { id: 3, jobId: 2, candidateId: 3, status: "Applied", appliedDate: "2026-11-01" },
  { id: 4, jobId: 3, candidateId: 4, status: "Applied", appliedDate: "2026-11-05" },
  { id: 5, jobId: 4, candidateId: 5, status: "Selected", appliedDate: "2026-09-15" },
  { id: 6, jobId: 2, candidateId: 1, status: "Rejected", appliedDate: "2026-11-03" },
]
const SAMPLE_INTERVIEWS = [
  { id: 1, applicationId: 1, date: "2026-11-25", time: "11:00", mode: "Online", interviewer: "Priya Mehta", result: "Pending", feedback: "" },
  { id: 2, applicationId: 5, date: "2026-09-22", time: "15:30", mode: "In person", interviewer: "Karan Malhotra", result: "Passed", feedback: "Strong with payroll and GST work." },
]

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
  job: { title: "", department: DEPARTMENTS[0], location: "", type: JOB_TYPES[0], openings: "1", description: "" },
  candidate: { name: "", email: "", phone: "", experience: "", skills: "" },
  application: { jobId: "", candidateId: "" },
  interview: { applicationId: "", date: "", time: "", mode: MODES[0], interviewer: "", result: "Pending", feedback: "" },
  result: { result: "Pending", feedback: "" },
}

const INPUT = "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/30"
const today = () => new Date().toISOString().slice(0, 10)

function formatDate(iso) {
  if (!iso) return "-"
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
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

function FormButtons({ onCancel, label }) {
  return (
    <div className="mt-6 flex justify-end gap-3">
      <button type="button" onClick={onCancel} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
      <button type="submit" className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800">{label}</button>
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
  const [jobs, setJobs] = useState(SAMPLE_JOBS)
  const [candidates, setCandidates] = useState(SAMPLE_CANDIDATES)
  const [applications, setApplications] = useState(SAMPLE_APPLICATIONS)
  const [interviews, setInterviews] = useState(SAMPLE_INTERVIEWS)
  const [appFilter, setAppFilter] = useState("All")

  const [modal, setModal] = useState(null) // { kind, id }
  const [form, setForm] = useState({})
  const [errors, setErrors] = useState({})
  const [viewCandidate, setViewCandidate] = useState(null)
  const [toast, setToast] = useState("")

  const jobById = (id) => jobs.find((j) => j.id === Number(id))
  const candById = (id) => candidates.find((c) => c.id === Number(id))
  const appById = (id) => applications.find((a) => a.id === Number(id))
  const appLabel = (a) => `${candById(a.candidateId)?.name} for ${jobById(a.jobId)?.title}`

  // ----- Statistics -----
  const stats = [
    { label: "Open jobs", value: jobs.filter((j) => j.status === "Open").length },
    { label: "Candidates", value: candidates.length },
    { label: "Applications", value: applications.length },
    { label: "Interviews waiting for a result", value: interviews.filter((i) => i.result === "Pending").length },
  ]

  function showToast(message) {
    setToast(message)
    setTimeout(() => setToast(""), 2500)
  }

  function openModal(kind, item, prefill) {
    setForm(item ? { ...item } : { ...DEFAULT_FORMS[kind], ...prefill })
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
      if (!form.name.trim()) e.name = "Enter the candidate's full name."
      if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Enter a valid email, like name@gmail.com."
      if (!/^\d{10}$/.test(form.phone)) e.phone = "Enter a 10-digit phone number."
    }
    if (k === "application") {
      if (!form.jobId) e.jobId = "Pick a job."
      if (!form.candidateId) e.candidateId = "Pick a candidate."
      if (form.jobId && form.candidateId && applications.some((a) => a.jobId === Number(form.jobId) && a.candidateId === Number(form.candidateId)))
        e.candidateId = "This candidate has already applied for this job."
    }
    if (k === "interview") {
      if (!form.applicationId) e.applicationId = "Pick an application."
      if (!form.date) e.date = "Pick an interview date."
      if (!form.time) e.time = "Pick a time."
      if (!form.interviewer.trim()) e.interviewer = "Enter the interviewer's name."
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function save(event) {
    event.preventDefault()
    if (!validate()) return
    const { kind, id } = modal
    if (kind === "job") {
      const data = { ...form, openings: Number(form.openings) }
      if (id === null) setJobs([{ ...data, id: Date.now(), status: "Open", postedDate: today() }, ...jobs])
      else setJobs(jobs.map((j) => (j.id === id ? data : j)))
      showToast(id === null ? "Job opening created" : "Job opening updated")
    }
    if (kind === "candidate") {
      if (id === null) setCandidates([{ ...form, id: Date.now() }, ...candidates])
      else setCandidates(candidates.map((c) => (c.id === id ? { ...form } : c)))
      showToast(id === null ? "Candidate added" : "Candidate updated")
    }
    if (kind === "application") {
      setApplications([{ id: Date.now(), jobId: Number(form.jobId), candidateId: Number(form.candidateId), status: "Applied", appliedDate: today() }, ...applications])
      showToast("Application added")
      setTab("Applications")
    }
    if (kind === "interview") {
      const data = { ...form, applicationId: Number(form.applicationId) }
      if (id === null) {
        setInterviews([{ ...data, id: Date.now() }, ...interviews])
        setApplications(applications.map((a) => (a.id === data.applicationId ? { ...a, status: "Interview Scheduled" } : a)))
      } else setInterviews(interviews.map((i) => (i.id === id ? data : i)))
      showToast(id === null ? "Interview scheduled" : "Interview updated")
      setTab("Interviews")
    }
    if (kind === "result") {
      setInterviews(interviews.map((i) => (i.id === id ? { ...i, result: form.result, feedback: form.feedback } : i)))
      showToast("Interview result saved")
    }
    setModal(null)
  }

  function toggleJob(job) {
    setJobs(jobs.map((j) => (j.id === job.id ? { ...j, status: j.status === "Open" ? "Closed" : "Open" } : j)))
    showToast(job.status === "Open" ? "Job closed" : "Job reopened")
  }

  function changeStatus(appId, status) {
    setApplications(applications.map((a) => (a.id === appId ? { ...a, status } : a)))
    showToast("Application status updated")
  }

  const shownApps = applications.filter((a) => appFilter === "All" || a.status === appFilter)
  const tabs = ["Jobs", "Candidates", "Applications", "Interviews"]
  const addLabel = { Jobs: ["job", "Create job opening"], Candidates: ["candidate", "Add candidate"], Applications: ["application", "Add application"], Interviews: ["interview", "Schedule interview"] }[tab]

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

      {/* Statistics */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">{s.label}</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Hiring pipeline: how many applications are in each status */}
      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5">
        <p className="text-sm font-medium text-slate-900">Applications by status</p>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {APP_STATUSES.map((s) => (
            <div key={s} className="rounded-lg bg-slate-50 px-3 py-2.5">
              <p className="text-xl font-semibold text-slate-900">{applications.filter((a) => a.status === s).length}</p>
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
        {/* ---------- JOBS ---------- */}
        {tab === "Jobs" && (
          <Table headers={["Job", "Department", "Location", "Openings", "Applicants", "Posted", "Status", "Actions"]} empty={jobs.length === 0 ? "No job openings yet. Click Create job opening to add one." : ""}>
            {jobs.map((j) => (
              <tr key={j.id} className="hover:bg-slate-50/70">
                <td className="px-5 py-3"><p className="font-medium text-slate-900">{j.title}</p><p className="text-xs text-slate-500">{j.type}</p></td>
                <td className="px-5 py-3 text-slate-700">{j.department}</td>
                <td className="px-5 py-3 text-slate-700">{j.location}</td>
                <td className="px-5 py-3 text-slate-700">{j.openings}</td>
                <td className="px-5 py-3 text-slate-700">{applications.filter((a) => a.jobId === j.id).length}</td>
                <td className="px-5 py-3 text-slate-700">{formatDate(j.postedDate)}</td>
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
        {tab === "Candidates" && (
          <Table headers={["Candidate", "Phone", "Experience", "Skills", "Applications", "Actions"]} empty={candidates.length === 0 ? "No candidates yet. Click Add candidate to add one." : ""}>
            {candidates.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50/70">
                <td className="px-5 py-3"><p className="font-medium text-slate-900">{c.name}</p><p className="text-xs text-slate-500">{c.email}</p></td>
                <td className="px-5 py-3 text-slate-700">{c.phone}</td>
                <td className="px-5 py-3 text-slate-700">{c.experience ? `${c.experience} years` : "Fresher"}</td>
                <td className="px-5 py-3 text-slate-700">{c.skills || "-"}</td>
                <td className="px-5 py-3 text-slate-700">{applications.filter((a) => a.candidateId === c.id).length}</td>
                <td className="whitespace-nowrap px-5 py-3 text-right">
                  <button onClick={() => setViewCandidate(c)} className={`${linkBtn} text-slate-700`}>View</button>
                  <button onClick={() => openModal("candidate", c)} className={`${linkBtn} text-teal-700`}>Edit</button>
                  <button onClick={() => openModal("application", null, { candidateId: String(c.id) })} className={`${linkBtn} text-indigo-700`}>Apply to job</button>
                </td>
              </tr>
            ))}
          </Table>
        )}

        {/* ---------- APPLICATIONS ---------- */}
        {tab === "Applications" && (
          <>
            <div className="mb-3">
              <select value={appFilter} onChange={(e) => setAppFilter(e.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-teal-600" aria-label="Filter by status">
                <option value="All">All statuses</option>
                {APP_STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <Table headers={["Candidate", "Job", "Applied on", "Status", "Actions"]} empty={shownApps.length === 0 ? "No applications match this status." : ""}>
              {shownApps.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50/70">
                  <td className="px-5 py-3 font-medium text-slate-900">{candById(a.candidateId)?.name}</td>
                  <td className="px-5 py-3 text-slate-700">{jobById(a.jobId)?.title}</td>
                  <td className="px-5 py-3 text-slate-700">{formatDate(a.appliedDate)}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <Badge value={a.status} />
                      <select value={a.status} onChange={(e) => changeStatus(a.id, e.target.value)} className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs outline-none focus:border-teal-600" aria-label="Change status">
                        {APP_STATUSES.map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-right">
                    <button onClick={() => openModal("interview", null, { applicationId: String(a.id) })} className={`${linkBtn} text-teal-700`}>Schedule interview</button>
                  </td>
                </tr>
              ))}
            </Table>
          </>
        )}

        {/* ---------- INTERVIEWS ---------- */}
        {tab === "Interviews" && (
          <Table headers={["Candidate", "Job", "Date and time", "Mode", "Interviewer", "Result", "Actions"]} empty={interviews.length === 0 ? "No interviews scheduled yet." : ""}>
            {interviews.map((i) => {
              const a = appById(i.applicationId)
              return (
                <tr key={i.id} className="hover:bg-slate-50/70">
                  <td className="px-5 py-3 font-medium text-slate-900">{candById(a?.candidateId)?.name}</td>
                  <td className="px-5 py-3 text-slate-700">{jobById(a?.jobId)?.title}</td>
                  <td className="px-5 py-3 text-slate-700">{formatDate(i.date)}, {i.time}</td>
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
              <Field label="Job type"><select className={INPUT} value={form.type} onChange={set("type")}>{JOB_TYPES.map((t) => <option key={t}>{t}</option>)}</select></Field>
              <Field label="Location" error={errors.location}><input className={INPUT} value={form.location} onChange={set("location")} /></Field>
              <Field label="Number of openings" error={errors.openings}><input inputMode="numeric" className={INPUT} value={form.openings} onChange={set("openings")} /></Field>
            </div>
            <Field label="Description"><textarea rows={3} className={INPUT} value={form.description} onChange={set("description")} /></Field>
            <FormButtons onCancel={() => setModal(null)} label={modal.id === null ? "Create job opening" : "Save changes"} />
          </form>
        </Modal>
      )}

      {modal?.kind === "candidate" && (
        <Modal title={modal.id === null ? "Add candidate" : "Edit candidate"} onClose={() => setModal(null)}>
          <form onSubmit={save} noValidate className="mt-5 space-y-4">
            <Field label="Full name" error={errors.name}><input className={INPUT} value={form.name} onChange={set("name")} /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Email" error={errors.email}><input type="email" className={INPUT} value={form.email} onChange={set("email")} /></Field>
              <Field label="Phone" error={errors.phone}><input className={INPUT} value={form.phone} onChange={set("phone")} /></Field>
            </div>
            <Field label="Years of experience (leave empty for a fresher)"><input inputMode="numeric" className={INPUT} value={form.experience} onChange={set("experience")} /></Field>
            <Field label="Skills (separate with commas)"><input className={INPUT} value={form.skills} onChange={set("skills")} /></Field>
            <FormButtons onCancel={() => setModal(null)} label={modal.id === null ? "Add candidate" : "Save changes"} />
          </form>
        </Modal>
      )}

      {modal?.kind === "application" && (
        <Modal title="Add application" onClose={() => setModal(null)}>
          <form onSubmit={save} noValidate className="mt-5 space-y-4">
            <Field label="Candidate" error={errors.candidateId}>
              <select className={INPUT} value={form.candidateId} onChange={set("candidateId")}>
                <option value="">Pick a candidate</option>
                {candidates.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Job (only open jobs are shown)" error={errors.jobId}>
              <select className={INPUT} value={form.jobId} onChange={set("jobId")}>
                <option value="">Pick a job</option>
                {jobs.filter((j) => j.status === "Open").map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
              </select>
            </Field>
            <FormButtons onCancel={() => setModal(null)} label="Add application" />
          </form>
        </Modal>
      )}

      {modal?.kind === "interview" && (
        <Modal title={modal.id === null ? "Schedule interview" : "Edit interview"} onClose={() => setModal(null)}>
          <form onSubmit={save} noValidate className="mt-5 space-y-4">
            <Field label="Application" error={errors.applicationId}>
              <select className={INPUT} value={form.applicationId} onChange={set("applicationId")} disabled={modal.id !== null}>
                <option value="">Pick an application</option>
                {applications.map((a) => <option key={a.id} value={a.id}>{appLabel(a)}</option>)}
              </select>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Date" error={errors.date}><input type="date" className={INPUT} value={form.date} onChange={set("date")} /></Field>
              <Field label="Time" error={errors.time}><input type="time" className={INPUT} value={form.time} onChange={set("time")} /></Field>
              <Field label="Mode"><select className={INPUT} value={form.mode} onChange={set("mode")}>{MODES.map((m) => <option key={m}>{m}</option>)}</select></Field>
              <Field label="Interviewer" error={errors.interviewer}><input className={INPUT} value={form.interviewer} onChange={set("interviewer")} /></Field>
            </div>
            <FormButtons onCancel={() => setModal(null)} label={modal.id === null ? "Schedule interview" : "Save changes"} />
          </form>
        </Modal>
      )}

      {modal?.kind === "result" && (
        <Modal title="Record interview result" onClose={() => setModal(null)}>
          <form onSubmit={save} noValidate className="mt-5 space-y-4">
            <p className="text-sm text-slate-600">{appLabel(appById(interviews.find((i) => i.id === modal.id)?.applicationId) || {})}</p>
            <Field label="Result"><select className={INPUT} value={form.result} onChange={set("result")}>{RESULTS.map((r) => <option key={r}>{r}</option>)}</select></Field>
            <Field label="Feedback"><textarea rows={3} className={INPUT} value={form.feedback} onChange={set("feedback")} /></Field>
            <FormButtons onCancel={() => setModal(null)} label="Save result" />
          </form>
        </Modal>
      )}

      {viewCandidate && (
        <Modal title={viewCandidate.name} onClose={() => setViewCandidate(null)}>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            {[["Email", viewCandidate.email], ["Phone", viewCandidate.phone], ["Experience", viewCandidate.experience ? `${viewCandidate.experience} years` : "Fresher"], ["Skills", viewCandidate.skills || "-"]].map(([l, v]) => (
              <div key={l}><dt className="text-xs text-slate-500">{l}</dt><dd className="mt-0.5 break-words text-sm font-medium text-slate-900">{v}</dd></div>
            ))}
          </dl>
          <p className="mt-6 text-sm font-medium text-slate-900">Applications</p>
          <div className="mt-2 space-y-2">
            {applications.filter((a) => a.candidateId === viewCandidate.id).map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5">
                <span className="text-sm text-slate-800">{jobById(a.jobId)?.title}</span>
                <Badge value={a.status} />
              </div>
            ))}
            {applications.filter((a) => a.candidateId === viewCandidate.id).length === 0 && <p className="text-sm text-slate-500">This candidate has not applied for any job yet.</p>}
          </div>
          <div className="mt-6 flex justify-end">
            <button onClick={() => setViewCandidate(null)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Close</button>
          </div>
        </Modal>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm text-white shadow-lg" role="status">
          {toast}
        </div>
      )}
    </div>
  )
}
