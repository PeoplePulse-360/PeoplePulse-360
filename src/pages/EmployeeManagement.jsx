import { useMemo, useState } from "react"

// ------------------------------------------------------------------
// TEMPORARY SAMPLE DATA
// This is fake data just so the page has something to show.
// Later (Step 7) we will replace it with real data from Supabase.
// ------------------------------------------------------------------
const DEPARTMENTS = ["Engineering", "Human Resources", "Marketing", "Sales", "Finance", "Operations"]
const STATUSES = ["Active", "On Leave", "Resigned"]

const SAMPLE_EMPLOYEES = [
  { id: 1, empId: "EMP-001", name: "Aarav Sharma", email: "aarav.sharma@peoplepulse.com", phone: "9876543210", department: "Engineering", designation: "Senior Developer", joiningDate: "2022-03-14", status: "Active" },
  { id: 2, empId: "EMP-002", name: "Priya Mehta", email: "priya.mehta@peoplepulse.com", phone: "9811122233", department: "Human Resources", designation: "HR Manager", joiningDate: "2021-07-01", status: "Active" },
  { id: 3, empId: "EMP-003", name: "Rohan Verma", email: "rohan.verma@peoplepulse.com", phone: "9822334455", department: "Marketing", designation: "Content Strategist", joiningDate: "2023-01-09", status: "On Leave" },
  { id: 4, empId: "EMP-004", name: "Sneha Kapoor", email: "sneha.kapoor@peoplepulse.com", phone: "9833445566", department: "Sales", designation: "Account Executive", joiningDate: "2020-11-23", status: "Active" },
  { id: 5, empId: "EMP-005", name: "Karan Malhotra", email: "karan.malhotra@peoplepulse.com", phone: "9844556677", department: "Finance", designation: "Financial Analyst", joiningDate: "2019-05-17", status: "Resigned" },
  { id: 6, empId: "EMP-006", name: "Ananya Iyer", email: "ananya.iyer@peoplepulse.com", phone: "9855667788", department: "Engineering", designation: "UI Designer", joiningDate: "2024-02-05", status: "Active" },
  { id: 7, empId: "EMP-007", name: "Vikram Singh", email: "vikram.singh@peoplepulse.com", phone: "9866778899", department: "Operations", designation: "Operations Lead", joiningDate: "2021-09-30", status: "Active" },
]

const EMPTY_FORM = { empId: "", name: "", email: "", phone: "", department: DEPARTMENTS[0], designation: "", joiningDate: "", status: "Active" }

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
