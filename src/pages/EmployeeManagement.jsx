import { useMemo, useState } from "react"

// ------------------------------------------------------------------
// TEMPORARY SAMPLE DATA
// This is fake data just so the page has something to show.
// Later we will replace it with real data from Supabase.
// ------------------------------------------------------------------
const DEPARTMENTS = ["Engineering", "Human Resources", "Marketing", "Sales", "Finance", "Operations"]
const STATUSES = ["Active", "On Leave", "Resigned"]

const SAMPLE_EMPLOYEES = [
  { id: 1, empId: "EMP-001", name: "Aarav Sharma", email: "aarav.sharma@peoplepulse.com", phone: "9876543210", department: "Engineering", designation: "Senior Developer", joiningDate: "2022-03-14", status: "Active", salary: "1200000" },
  { id: 2, empId: "EMP-002", name: "Priya Mehta", email: "priya.mehta@peoplepulse.com", phone: "9811122233", department: "Human Resources", designation: "HR Manager", joiningDate: "2021-07-01", status: "Active", salary: "950000" },
  { id: 3, empId: "EMP-003", name: "Rohan Verma", email: "rohan.verma@peoplepulse.com", phone: "9822334455", department: "Marketing", designation: "Content Strategist", joiningDate: "2023-01-09", status: "On Leave", salary: "700000" },
  { id: 4, empId: "EMP-004", name: "Sneha Kapoor", email: "sneha.kapoor@peoplepulse.com", phone: "9833445566", department: "Sales", designation: "Account Executive", joiningDate: "2020-11-23", status: "Active", salary: "800000" },
  { id: 5, empId: "EMP-005", name: "Karan Malhotra", email: "karan.malhotra@peoplepulse.com", phone: "9844556677", department: "Finance", designation: "Financial Analyst", joiningDate: "2019-05-17", status: "Resigned", salary: "850000" },
  { id: 6, empId: "EMP-006", name: "Ananya Iyer", email: "ananya.iyer@peoplepulse.com", phone: "9855667788", department: "Engineering", designation: "UI Designer", joiningDate: "2024-02-05", status: "Active", salary: "" },
  { id: 7, empId: "EMP-007", name: "Vikram Singh", email: "vikram.singh@peoplepulse.com", phone: "9866778899", department: "Operations", designation: "Operations Lead", joiningDate: "2021-09-30", status: "Active", salary: "900000" },
]

const EMPTY_FORM = { empId: "", name: "", email: "", phone: "", department: DEPARTMENTS[0], designation: "", joiningDate: "", status: "Active", salary: "" }

const STATUS_STYLES = {
  Active: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  "On Leave": "bg-amber-50 text-amber-700 ring-amber-600/20",
  Resigned: "bg-slate-100 text-slate-600 ring-slate-500/20",
}

const AVATAR_COLORS = ["bg-teal-600", "bg-sky-600", "bg-violet-600", "bg-rose-600", "bg-amber-600", "bg-indigo-600"]

function initials(name) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("")
}

function formatDate(iso) {
  if (!iso) return "-"
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
}

function formatSalary(value) {
  if (value === "" || value === null || value === undefined) return "Not added"
  return "₹" + Number(value).toLocaleString("en-IN") + " per year"
}

export default function EmployeeManagement() {
  const [employees, setEmployees] = useState(SAMPLE_EMPLOYEES)
  const [search, setSearch] = useState("")
  const [deptFilter, setDeptFilter] = useState("All")
  const [statusFilter, setStatusFilter] = useState("All")

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState(null) // null = adding a new employee
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [viewTarget, setViewTarget] = useState(null) // employee whose profile is open
  const [toast, setToast] = useState("")

  // ----- Statistics -----
  const stats = useMemo(() => {
    const count = (s) => employees.filter((e) => e.status === s).length
    return [
      { label: "Total employees", value: employees.length, tone: "text-slate-900" },
      { label: "Active", value: count("Active"), tone: "text-emerald-700" },
      { label: "On leave", value: count("On Leave"), tone: "text-amber-700" },
      { label: "Resigned", value: count("Resigned"), tone: "text-slate-500" },
    ]
  }, [employees])

  // ----- Search + filters -----
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    return employees.filter((e) => {
      const matchesSearch = !q || [e.name, e.empId, e.email, e.designation].some((v) => v.toLowerCase().includes(q))
      const matchesDept = deptFilter === "All" || e.department === deptFilter
      const matchesStatus = statusFilter === "All" || e.status === statusFilter
      return matchesSearch && matchesDept && matchesStatus
    })
  }, [employees, search, deptFilter, statusFilter])

  function showToast(message) {
    setToast(message)
    setTimeout(() => setToast(""), 2500)
  }

  // ----- Open the form -----
  function openAdd() {
    const next = String(employees.length + 1).padStart(3, "0")
    setForm({ ...EMPTY_FORM, empId: `EMP-${next}` })
    setEditingId(null)
    setErrors({})
    setFormOpen(true)
  }

  function openEdit(emp) {
    setForm({ ...emp })
    setEditingId(emp.id)
    setErrors({})
    setFormOpen(true)
  }

  // ----- Save (add or edit) -----
  function validate() {
    const e = {}
    if (!form.name.trim()) e.name = "Enter the employee's full name."
    if (!form.empId.trim()) e.empId = "Enter an employee ID."
    else if (employees.some((x) => x.empId === form.empId.trim() && x.id !== editingId)) e.empId = "This employee ID is already used."
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Enter a valid email, like name@company.com."
    if (!/^\d{10}$/.test(form.phone)) e.phone = "Enter a 10-digit phone number."
    if (!form.designation.trim()) e.designation = "Enter a designation."
    if (!form.joiningDate) e.joiningDate = "Pick a joining date."
    if (form.salary !== "" && (isNaN(Number(form.salary)) || Number(form.salary) < 0)) e.salary = "Enter the salary as a number, like 600000."
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSave(event) {
    event.preventDefault()
    if (!validate()) return
    if (editingId === null) {
      setEmployees([{ ...form, id: Date.now() }, ...employees])
      showToast("Employee added")
    } else {
      setEmployees(employees.map((x) => (x.id === editingId ? { ...form, id: editingId } : x)))
      showToast("Changes saved")
    }
    setFormOpen(false)
  }

  function confirmDelete() {
    setEmployees(employees.filter((x) => x.id !== deleteTarget.id))
    setDeleteTarget(null)
    showToast("Employee deleted")
  }

  function updateField(key, value) {
    setForm({ ...form, [key]: value })
  }

  const inputClass = (key) =>
    `mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-teal-600/30 ${
      errors[key] ? "border-rose-400" : "border-slate-300 focus:border-teal-600"
    }`

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-8">
      {/* Page title + Add button */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Employees</h1>
          <p className="mt-1 text-sm text-slate-500">Add, find and update everyone who works at the company.</p>
        </div>
        <button
          onClick={openAdd}
          className="rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-teal-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
        >
          Add employee
        </button>
      </div>

      {/* Statistics */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">{s.label}</p>
            <p className={`mt-2 text-3xl font-semibold ${s.tone}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search + filters */}
      <div className="mt-6 flex flex-wrap gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, ID, email or designation"
          className="min-w-[240px] flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/30"
        />
        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-teal-600"
          aria-label="Filter by department"
        >
          <option value="All">All departments</option>
          {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-teal-600"
          aria-label="Filter by status"
        >
          <option value="All">All statuses</option>
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Employee table */}
      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
            <tr>
              <th className="px-5 py-3 font-medium">Employee</th>
              <th className="px-5 py-3 font-medium">ID</th>
              <th className="px-5 py-3 font-medium">Department</th>
              <th className="px-5 py-3 font-medium">Designation</th>
              <th className="px-5 py-3 font-medium">Joined</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visible.map((e) => (
              <tr key={e.id} className="hover:bg-slate-50/70">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-white ${AVATAR_COLORS[e.id % AVATAR_COLORS.length]}`}>
                      {initials(e.name)}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{e.name}</p>
                      <p className="text-xs text-slate-500">{e.email}</p>
                      <p className="text-xs text-slate-500">{e.phone}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3 text-slate-700">{e.empId}</td>
                <td className="px-5 py-3 text-slate-700">{e.department}</td>
                <td className="px-5 py-3 text-slate-700">{e.designation}</td>
                <td className="px-5 py-3 text-slate-700">{formatDate(e.joiningDate)}</td>
                <td className="px-5 py-3">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${STATUS_STYLES[e.status]}`}>
                    {e.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-right whitespace-nowrap">
                  <button onClick={() => setViewTarget(e)} className="rounded-md px-2.5 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100">View</button>
                  <button onClick={() => openEdit(e)} className="rounded-md px-2.5 py-1.5 text-sm font-medium text-teal-700 hover:bg-teal-50">Edit</button>
                  <button onClick={() => setDeleteTarget(e)} className="rounded-md px-2.5 py-1.5 text-sm font-medium text-rose-600 hover:bg-rose-50">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {visible.length === 0 && (
          <div className="px-5 py-14 text-center">
            <p className="font-medium text-slate-900">No employees match your search</p>
            <p className="mt-1 text-sm text-slate-500">Clear the search box or change the filters to see more people.</p>
          </div>
        )}
      </div>
      <p className="mt-3 text-xs text-slate-500">Showing {visible.length} of {employees.length} employees</p>

      {/* Employee profile (popup) */}
      {viewTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={() => setViewTarget(null)}>
          <div onClick={(e) => e.stopPropagation()} className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center gap-4">
              <div className={`flex h-16 w-16 items-center justify-center rounded-full text-xl font-semibold text-white ${AVATAR_COLORS[viewTarget.id % AVATAR_COLORS.length]}`}>
                {initials(viewTarget.name)}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900">{viewTarget.name}</h2>
                <p className="text-sm text-slate-500">{viewTarget.designation}, {viewTarget.department}</p>
                <span className={`mt-1.5 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${STATUS_STYLES[viewTarget.status]}`}>
                  {viewTarget.status}
                </span>
              </div>
            </div>
            <dl className="mt-6 grid gap-x-6 gap-y-4 border-t border-slate-100 pt-5 sm:grid-cols-2">
              {[
                ["Employee ID", viewTarget.empId],
                ["Email", viewTarget.email],
                ["Phone", viewTarget.phone],
                ["Department", viewTarget.department],
                ["Designation", viewTarget.designation],
                ["Joining date", formatDate(viewTarget.joiningDate)],
                ["Employment status", viewTarget.status],
                ["Salary", formatSalary(viewTarget.salary)],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs text-slate-500">{label}</dt>
                  <dd className="mt-0.5 break-words text-sm font-medium text-slate-900">{value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setViewTarget(null)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Close</button>
              <button
                onClick={() => { const emp = viewTarget; setViewTarget(null); openEdit(emp) }}
                className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
              >
                Edit employee
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit form (popup) */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={() => setFormOpen(false)}>
          <form
            onSubmit={handleSave}
            onClick={(e) => e.stopPropagation()}
            noValidate
            className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
          >
            <h2 className="text-lg font-semibold text-slate-900">{editingId === null ? "Add employee" : "Edit employee"}</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-slate-700">Full name
                <input className={inputClass("name")} value={form.name} onChange={(e) => updateField("name", e.target.value)} />
                {errors.name && <span className="mt-1 block text-xs font-normal text-rose-600">{errors.name}</span>}
              </label>
              <label className="text-sm font-medium text-slate-700">Employee ID
                <input className={inputClass("empId")} value={form.empId} onChange={(e) => updateField("empId", e.target.value)} />
                {errors.empId && <span className="mt-1 block text-xs font-normal text-rose-600">{errors.empId}</span>}
              </label>
              <label className="text-sm font-medium text-slate-700">Email
                <input type="email" className={inputClass("email")} value={form.email} onChange={(e) => updateField("email", e.target.value)} />
                {errors.email && <span className="mt-1 block text-xs font-normal text-rose-600">{errors.email}</span>}
              </label>
              <label className="text-sm font-medium text-slate-700">Phone
                <input className={inputClass("phone")} value={form.phone} onChange={(e) => updateField("phone", e.target.value)} />
                {errors.phone && <span className="mt-1 block text-xs font-normal text-rose-600">{errors.phone}</span>}
              </label>
              <label className="text-sm font-medium text-slate-700">Department
                <select className={inputClass("department")} value={form.department} onChange={(e) => updateField("department", e.target.value)}>
                  {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
                </select>
              </label>
              <label className="text-sm font-medium text-slate-700">Designation
                <input className={inputClass("designation")} value={form.designation} onChange={(e) => updateField("designation", e.target.value)} />
                {errors.designation && <span className="mt-1 block text-xs font-normal text-rose-600">{errors.designation}</span>}
              </label>
              <label className="text-sm font-medium text-slate-700">Joining date
                <input type="date" className={inputClass("joiningDate")} value={form.joiningDate} onChange={(e) => updateField("joiningDate", e.target.value)} />
                {errors.joiningDate && <span className="mt-1 block text-xs font-normal text-rose-600">{errors.joiningDate}</span>}
              </label>
              <label className="text-sm font-medium text-slate-700">Employment status
                <select className={inputClass("status")} value={form.status} onChange={(e) => updateField("status", e.target.value)}>
                  {STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </label>
              <label className="text-sm font-medium text-slate-700 sm:col-span-2">Salary per year in rupees (optional)
                <input inputMode="numeric" placeholder="For example 600000" className={inputClass("salary")} value={form.salary} onChange={(e) => updateField("salary", e.target.value)} />
                {errors.salary && <span className="mt-1 block text-xs font-normal text-rose-600">{errors.salary}</span>}
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setFormOpen(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
              <button type="submit" className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800">
                {editingId === null ? "Add employee" : "Save changes"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete confirmation (popup) */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={() => setDeleteTarget(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900">Delete {deleteTarget.name}?</h2>
            <p className="mt-2 text-sm text-slate-600">This removes the employee record. You can't undo this.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setDeleteTarget(null)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Keep employee</button>
              <button onClick={confirmDelete} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700">Delete employee</button>
            </div>
          </div>
        </div>
      )}

      {/* Small message at the bottom after an action */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm text-white shadow-lg" role="status">
          {toast}
        </div>
      )}
    </div>
  )
}
