import { useEffect, useState } from "react"
import { supabase } from "../utils/supabaseClient"

export default function AttendanceManagement() {
  
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [attendanceRecords, setAttendanceRecords] = useState([])
  const [selectedStatuses, setSelectedStatuses] = useState({})
  const [selectedDate, setSelectedDate] = useState(() => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, "0")
  const day = String(today.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}) 

  useEffect(() => {
    async function fetchEmployees() {
      const { data, error } = await supabase
        .from("employees")
        .select("id, emp_id, full_name, department")
        .order("full_name")

      if (error) {
        console.error("Error fetching employees:", error)
      } else {
        setEmployees(data ?? [])
      }

      setLoading(false)
    }

    fetchEmployees()
  }, [])
useEffect(() => {
  async function fetchAttendance() {
    const { data, error } = await supabase
      .from("attendance")
      .select("*")
      .eq("attendance_date", selectedDate)

    if (error) {
      console.error("Error fetching attendance:", error)
      return
    }

    setAttendanceRecords(data ?? [])
    setSelectedStatuses(
  Object.fromEntries(
    (data ?? []).map((record) => [
      record.employee_id,
      record.status,
    ])
  )
)
    console.log("Attendance records:", data)
  }

  fetchAttendance()
}, [selectedDate])
const presentCount = attendanceRecords.filter(
  (record) => record.status === "Present"
).length

const absentCount = attendanceRecords.filter(
  (record) => record.status === "Absent"
).length

const lateCount = attendanceRecords.filter(
  (record) => record.status === "Late"
).length

const halfDayCount = attendanceRecords.filter(
  (record) => record.status === "Half Day"
).length
async function saveAttendance() {
  const recordsToSave = Object.entries(selectedStatuses)
    .filter(([employeeId, status]) => status)
    .map(([employeeId, status]) => ({
      employee_id: employeeId,
      attendance_date: selectedDate,
      status: status,
    }))

  if (recordsToSave.length === 0) {
    alert("Please select attendance status for at least one employee.")
    return
  }

  const { error } = await supabase
    .from("attendance")
    .upsert(recordsToSave, {
      onConflict: "employee_id,attendance_date",
    })

  if (error) {
    console.error("Error saving attendance:", error)
    alert("Could not save attendance. Check the database permissions.")
    return
  }

  alert("Attendance saved successfully!")
}
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Attendance Management
        </h1>
        <p className="text-slate-500">
          View and manage daily employee attendance.
        </p>
          <div className="mt-6">
  <label className="mb-2 block font-medium">
    Select attendance date
  </label>

  <input
    type="date"
    value={selectedDate}
    onChange={(e) => setSelectedDate(e.target.value)}
    className="rounded-lg border border-slate-300 bg-white p-2"
  />
</div>
      </div>

      {loading ? (
        <p>Loading employees...</p>
      ) : (
        <div>
  <p className="mb-4 font-medium">
    Total employees: {employees.length}
  </p>
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
  <div className="rounded-lg bg-white border p-4">
    <p className="text-slate-500">Present</p>
    <h2 className="text-2xl font-bold text-green-600">{presentCount}</h2>
  </div>

  <div className="rounded-lg bg-white border p-4">
    <p className="text-slate-500">Absent</p>
    <h2 className="text-2xl font-bold text-red-600">{absentCount}</h2>
  </div>

  <div className="rounded-lg bg-white border p-4">
    <p className="text-slate-500">Late</p>
    <h2 className="text-2xl font-bold text-orange-600">{lateCount}</h2>
  </div>

  <div className="rounded-lg bg-white border p-4">
    <p className="text-slate-500">Half Day</p>
    <h2 className="text-2xl font-bold text-blue-600">{halfDayCount}</h2>
  </div>
</div>

  <div className="space-y-3">
    {employees.map((employee) => (
      <div
        key={employee.id}
        className="flex items-center justify-between rounded-lg border bg-white p-4"
      >
        <div>
          <h3 className="font-semibold">{employee.full_name}</h3>
          <p className="text-sm text-slate-500">
  Attendance: {
    attendanceRecords.find(
      (record) => record.employee_id === employee.id
    )?.status ?? "Not marked"
  }
</p>
          <p className="text-sm text-slate-500">
            {employee.emp_id} · {employee.department}
          </p>
        </div>
        <div>
  <select
    value={selectedStatuses[employee.id] || ""}
    onChange={(e) =>
      setSelectedStatuses({
        ...selectedStatuses,
        [employee.id]: e.target.value,
      })
    }
    className="rounded-lg border border-slate-300 bg-white p-2"
  >
    <option value="">Select status</option>
    <option value="Present">Present</option>
    <option value="Absent">Absent</option>
    <option value="Late">Late</option>
    <option value="Half Day">Half Day</option>
  </select>
</div>
      </div>
    ))}
  </div>
<button
  onClick={saveAttendance}
  className="mt-6 rounded-lg bg-teal-700 px-6 py-3 font-medium text-white hover:bg-teal-800"
>
  Save Attendance
</button>
</div>
      )}
    </div>
  )
}