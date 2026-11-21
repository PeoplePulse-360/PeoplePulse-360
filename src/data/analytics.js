/**
 * Synthetic snapshot for the HR Analytics demonstration.
 * Replace this module when live workforce data is available.
 */

const departmentRows = [
  {
    name: "Engineering",
    shortName: "Engineering",
    employees: 86,
    newHires: 6,
    exits: 5,
    rating: 4.3,
    goalsCompleted: 148,
    goalsInProgress: 36,
    goalsNotStarted: 10,
  },
  {
    name: "Product",
    shortName: "Product",
    employees: 24,
    newHires: 2,
    exits: 1,
    rating: 4.4,
    goalsCompleted: 44,
    goalsInProgress: 12,
    goalsNotStarted: 4,
  },
  {
    name: "Design",
    shortName: "Design",
    employees: 14,
    newHires: 1,
    exits: 0,
    rating: 4.5,
    goalsCompleted: 26,
    goalsInProgress: 6,
    goalsNotStarted: 2,
  },
  {
    name: "Sales",
    shortName: "Sales",
    employees: 42,
    newHires: 3,
    exits: 4,
    rating: 3.8,
    goalsCompleted: 58,
    goalsInProgress: 22,
    goalsNotStarted: 8,
  },
  {
    name: "Marketing",
    shortName: "Marketing",
    employees: 18,
    newHires: 1,
    exits: 2,
    rating: 4,
    goalsCompleted: 32,
    goalsInProgress: 8,
    goalsNotStarted: 3,
  },
  {
    name: "Human Resources",
    shortName: "HR",
    employees: 12,
    newHires: 1,
    exits: 1,
    rating: 4.2,
    goalsCompleted: 18,
    goalsInProgress: 5,
    goalsNotStarted: 1,
  },
  {
    name: "Finance",
    shortName: "Finance",
    employees: 16,
    newHires: 1,
    exits: 1,
    rating: 4.1,
    goalsCompleted: 28,
    goalsInProgress: 7,
    goalsNotStarted: 2,
  },
  {
    name: "Operations",
    shortName: "Operations",
    employees: 28,
    newHires: 2,
    exits: 3,
    rating: 3.9,
    goalsCompleted: 34,
    goalsInProgress: 14,
    goalsNotStarted: 4,
  },
  {
    name: "Customer Success",
    shortName: "Cust. Success",
    employees: 22,
    newHires: 1,
    exits: 2,
    rating: 4,
    goalsCompleted: 24,
    goalsInProgress: 8,
    goalsNotStarted: 2,
  },
]

const recruitmentMonths = [
  { month: "Jan", applications: 22, selected: 2, rejected: 14 },
  { month: "Feb", applications: 26, selected: 2, rejected: 16 },
  { month: "Mar", applications: 31, selected: 3, rejected: 18 },
  { month: "Apr", applications: 28, selected: 2, rejected: 19 },
  { month: "May", applications: 34, selected: 3, rejected: 21 },
  { month: "Jun", applications: 29, selected: 3, rejected: 20 },
  { month: "Jul", applications: 24, selected: 2, rejected: 17 },
  { month: "Aug", applications: 27, selected: 2, rejected: 18 },
  { month: "Sep", applications: 33, selected: 3, rejected: 24 },
  { month: "Oct", applications: 30, selected: 3, rejected: 23 },
  { month: "Nov", applications: 28, selected: 3, rejected: 24 },
]

const feedbackMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov"]
const feedbackScoreTenths = [41, 41, 42, 42, 43, 42, 41, 42, 43, 43, 42]
const attendanceLabels = ["Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov"]
const earlierAttendanceTenths = [912, 906, 910, 924, 921, 932, 928, 915, 920, 936, 942]

const present = 241
const absent = 14
const onLeave = 7
const openings = 14
const candidates = 186
const inReview = 70
const leavePending = 9
const leaveApproved = 34
const leaveRejected = 6

function sumBy(rows, key) {
  return rows.reduce((total, row) => total + row[key], 0)
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`Sample data check failed for ${label}. Expected ${expected}, received ${actual}.`)
  }
}

const employees = sumBy(departmentRows, "employees")
const newEmployees = sumBy(departmentRows, "newHires")
const totalExits = sumBy(departmentRows, "exits")
const goalsCompleted = sumBy(departmentRows, "goalsCompleted")
const goalsInProgress = sumBy(departmentRows, "goalsInProgress")
const goalsNotStarted = sumBy(departmentRows, "goalsNotStarted")
const goalTotal = goalsCompleted + goalsInProgress + goalsNotStarted
const applications = sumBy(recruitmentMonths, "applications")
const selected = sumBy(recruitmentMonths, "selected")
const rejected = sumBy(recruitmentMonths, "rejected")
const attendanceTenths = Math.round((present / (present + absent)) * 1000)
const goalCompletionTenths = Math.round((goalsCompleted / goalTotal) * 1000)
const weightedRatingTenths = departmentRows.reduce(
  (total, row) => total + Math.round(row.rating * 10) * row.employees,
  0,
)
const averagePerformanceTenths = Math.round(weightedRatingTenths / employees)
const feedbackScoreTotal = feedbackScoreTenths.reduce((total, score) => total + score, 0)
const averageFeedbackTenths = Math.round(feedbackScoreTotal / feedbackScoreTenths.length)

assertEqual(employees, 262, "headcount")
assertEqual(newEmployees, 18, "new hires")
assertEqual(totalExits, 19, "exits")
assertEqual(goalsCompleted, 412, "completed goals")
assertEqual(goalsInProgress, 118, "goals in progress")
assertEqual(goalsNotStarted, 36, "goals not started")
assertEqual(applications, 312, "applications")
assertEqual(selected, 28, "selected candidates")
assertEqual(rejected, 214, "rejected candidates")
assertEqual(selected + rejected + inReview, applications, "application outcomes")
assertEqual(present + absent + onLeave, employees, "today's attendance")
assertEqual(attendanceTenths, 945, "attendance rate")
assertEqual(goalCompletionTenths, 728, "goal completion")
assertEqual(averagePerformanceTenths, 41, "average performance")
assertEqual(feedbackScoreTotal, 462, "feedback scores")
assertEqual(averageFeedbackTenths, 42, "average feedback")

export const isDemonstrationData = true

export const reportingPeriod = {
  asOf: "20 November 2026",
  yearLabel: "2026 year to date",
  attendanceWindow: "December 2025 – November 2026",
}

export const departments = departmentRows

export const workforceMix = [
  { name: "Full-time", value: 214 },
  { name: "Contract", value: 28 },
  { name: "Intern", value: 12 },
  { name: "Part-time", value: 8 },
]

assertEqual(sumBy(workforceMix, "value"), employees, "workforce mix")

export const monthlyAttendance = [
  ...earlierAttendanceTenths.map((tenths, index) => ({
    month: attendanceLabels[index],
    rate: tenths / 10,
  })),
  { month: "Nov", rate: attendanceTenths / 10 },
]

assertEqual(monthlyAttendance.length, 12, "attendance months")

export const recruitmentTrend = recruitmentMonths

export const feedbackSentiment = [
  { name: "Positive", value: 148 },
  { name: "Neutral", value: 41 },
  { name: "Negative", value: 19 },
]

assertEqual(sumBy(feedbackSentiment, "value"), 208, "feedback responses")

export const feedbackTrend = feedbackMonths.map((month, index) => ({
  month,
  score: feedbackScoreTenths[index] / 10,
}))

export const exitReasons = [
  { name: "Career growth", count: 6 },
  { name: "Compensation", count: 4 },
  { name: "Relocation", count: 3 },
  { name: "Higher studies", count: 2 },
  { name: "Work-life balance", count: 2 },
  { name: "Personal reasons", count: 2 },
]

assertEqual(sumBy(exitReasons, "count"), totalExits, "exit reasons")

const topExitDepartment = [...departmentRows].sort(
  (left, right) => right.exits - left.exits || left.name.localeCompare(right.name),
)[0]

const topExitReason = [...exitReasons].sort(
  (left, right) => right.count - left.count || left.name.localeCompare(right.name),
)[0]

export const dashboardSummary = {
  employees,
  newEmployees,
  openings,
  candidates,
  applications,
  selected,
  rejected,
  inReview,
  attendanceRate: attendanceTenths / 10,
  present,
  absent,
  onLeave,
  leavePending,
  leaveApproved,
  leaveRejected,
  averagePerformance: averagePerformanceTenths / 10,
  goalCompletion: goalCompletionTenths / 10,
  goalsCompleted,
  goalsInProgress,
  goalsNotStarted,
  goalTotal,
  averageFeedback: averageFeedbackTenths / 10,
  positiveFeedback: 148,
  neutralFeedback: 41,
  negativeFeedback: 19,
  feedbackResponses: 208,
  totalExits,
  topExitDepartment: topExitDepartment.name,
  topExitDepartmentCount: topExitDepartment.exits,
  topExitReason: topExitReason.name,
  topExitReasonCount: topExitReason.count,
}
