import { useEffect } from "react"
import {
  Briefcase,
  Building,
  CalendarCheck,
  CalendarOff,
  CalendarX,
  CircleCheck,
  CircleDashed,
  ClipboardList,
  DoorOpen,
  FileText,
  Flag,
  MessageSquare,
  Minus,
  Percent,
  Star,
  Target,
  ThumbsDown,
  ThumbsUp,
  UserCheck,
  UserPlus,
  UserX,
  Users,
} from "lucide-react"
import ChartCard from "../components/ChartCard"
import DemoNotice from "../components/DemoNotice"
import KpiCard from "../components/KpiCard"
import MetricSection from "../components/MetricSection"
import AttendanceTrendChart from "../components/charts/AttendanceTrendChart"
import DepartmentExitsChart from "../components/charts/DepartmentExitsChart"
import DepartmentHeadcountChart from "../components/charts/DepartmentHeadcountChart"
import EmployeeDistributionChart from "../components/charts/EmployeeDistributionChart"
import ExitReasonChart from "../components/charts/ExitReasonChart"
import FeedbackSentimentChart from "../components/charts/FeedbackSentimentChart"
import FeedbackTrendChart from "../components/charts/FeedbackTrendChart"
import GoalCompletionChart from "../components/charts/GoalCompletionChart"
import PerformanceChart from "../components/charts/PerformanceChart"
import RecruitmentChart from "../components/charts/RecruitmentChart"
import {
  dashboardSummary as summary,
  departments,
  exitReasons,
  feedbackSentiment,
  feedbackTrend,
  monthlyAttendance,
  recruitmentTrend,
  reportingPeriod,
  workforceMix,
} from "../data/analytics"
import { useExitAnalytics } from "../lib/useExitAnalytics"
import { useLiveAnalytics } from "../lib/useLiveAnalytics"
import { formatNumber, formatPercent, formatRating } from "../utils/format"

export default function AnalyticsDashboard() {
  useEffect(() => {
    document.title = "HR Analytics · PEOPLEPULSE 360"
  }, [])

  // ---- Live data from the read-only analytics views (when signed in) ----
  const liveAnalytics = useLiveAnalytics()
  const liveStatus = liveAnalytics.status
  const liveData = liveStatus === "live" ? liveAnalytics.data : null

  function sourceLabel(isLive) {
    if (isLive) return "Live data from the database."
    if (liveStatus === "loading") return "Loading…"
    if (liveStatus === "error") return "Sample data (live data could not be loaded)."
    return "Sample data."
  }

  // Workforce
  const liveWorkforce = Boolean(liveData?.hasEmployees)
  const workforceDepartments = liveWorkforce ? liveData.departments : departments
  const totalEmployees = liveWorkforce ? liveData.employees : summary.employees
  const newEmployees = liveWorkforce ? liveData.newEmployees : summary.newEmployees
  const workforceMixRows = liveWorkforce && liveData.workforceMix.length > 0 ? liveData.workforceMix : workforceMix

  // Attendance (live only once the attendance table has rows)
  const liveAttendance = Boolean(liveData?.hasAttendance)
  const attendance = liveAttendance
    ? liveData.attendance
    : {
        present: summary.present,
        absent: summary.absent,
        onLeave: summary.onLeave,
        rate: summary.attendanceRate,
      }
  const liveAttendanceTrend = Boolean(liveData?.hasAttendanceTrend)
  const attendanceTrendRows = liveAttendanceTrend ? liveData.monthlyAttendance : monthlyAttendance

  // Recruitment
  const liveRecruitment = Boolean(liveData?.hasRecruitment)
  const recruitment = liveRecruitment
    ? liveData.recruitment
    : {
        openings: summary.openings,
        candidates: summary.candidates,
        applications: summary.applications,
        selected: summary.selected,
        rejected: summary.rejected,
        inReview: summary.inReview,
      }
  const recruitmentTrendRows = liveRecruitment ? liveData.recruitmentTrend : recruitmentTrend

  // Leave (live only once the leaves table has rows)
  const liveLeave = Boolean(liveData?.hasLeave)
  const leave = liveLeave
    ? liveData.leave
    : { pending: summary.leavePending, approved: summary.leaveApproved, rejected: summary.leaveRejected }

  // ---- Exit analytics: live Supabase data when signed in, demo data otherwise ----
  const exitLive = useExitAnalytics()
  const live = exitLive.status === "live" ? exitLive.data : null
  const exitDepartments = live ? live.departments : departments
  const exitReasonRows = live ? live.reasons : exitReasons
  const exitTotal = live ? live.totalExits : summary.totalExits
  const noExits = exitTotal === 0

  const topDeptRow = [...exitDepartments].sort((a, b) => b.exits - a.exits)[0]
  const topExitDept = topDeptRow && topDeptRow.exits > 0 ? topDeptRow : null
  const topReasonRow = [...exitReasonRows].sort((a, b) => b.count - a.count)[0]
  const topExitReasonRow = topReasonRow && topReasonRow.count > 0 ? topReasonRow : null

  const exitSourceLabel = live
    ? "Live data from the exit records database."
    : exitLive.status === "loading"
      ? "Loading exit data…"
      : exitLive.status === "error"
        ? "Could not load live exit data, so demonstration data is shown."
        : "Demonstration data. Sign in on the Exit Management page to see live numbers."

  const exitSummaryText = noExits
    ? "No exits have been recorded yet."
    : `${formatNumber(exitTotal)} ${live ? "exits recorded" : "separations in 2026"}. ${topExitDept ? topExitDept.name : "No department"} accounts for ${formatNumber(topExitDept ? topExitDept.exits : 0)}, and ${topExitReasonRow ? topExitReasonRow.name.toLowerCase() : "no reason"} is the most common reason.`

  // ---- KPI card definitions ----
  const workforceCards = [
    {
      label: "Total employees",
      value: formatNumber(totalEmployees),
      hint: liveWorkforce ? "Active headcount, resigned employees excluded" : "Active headcount",
      icon: Users,
      tone: "indigo",
    },
    {
      label: "New employees",
      value: formatNumber(newEmployees),
      hint: liveWorkforce ? "Joined this month" : "Joined in November 2026",
      icon: UserPlus,
      tone: "blue",
    },
  ]

  const attendanceCards = [
    {
      label: "Attendance",
      value: formatPercent(attendance.rate),
      hint: "Present divided by people scheduled today",
      icon: Percent,
      tone: "indigo",
    },
    {
      label: "Present",
      value: formatNumber(attendance.present),
      hint: "Marked present today",
      icon: UserCheck,
      tone: "emerald",
    },
    {
      label: "Absent",
      value: formatNumber(attendance.absent),
      hint: "Unplanned absence today",
      icon: UserX,
      tone: "rose",
    },
    {
      label: "On leave",
      value: formatNumber(attendance.onLeave),
      hint: "Approved leave today",
      icon: CalendarOff,
      tone: "amber",
    },
  ]

  const recruitmentCards = [
    {
      label: "Job openings",
      value: formatNumber(recruitment.openings),
      hint: liveRecruitment ? "Open job postings" : "Open requisitions",
      icon: Briefcase,
      tone: "indigo",
    },
    {
      label: "Candidates",
      value: formatNumber(recruitment.candidates),
      hint: liveRecruitment ? "Registered candidates" : "Unique applicants, 2026",
      icon: Users,
      tone: "blue",
    },
    {
      label: "Applications received",
      value: formatNumber(recruitment.applications),
      hint: liveRecruitment ? "Applications on record" : "Submissions in 2026",
      icon: FileText,
      tone: "indigo",
    },
    {
      label: "Selected",
      value: formatNumber(recruitment.selected),
      hint: liveRecruitment ? "Applications marked Selected" : "Offers accepted in 2026",
      icon: UserCheck,
      tone: "emerald",
    },
    {
      label: "Rejected",
      value: formatNumber(recruitment.rejected),
      hint: liveRecruitment ? "Applications marked Rejected" : "Closed without an offer in 2026",
      icon: UserX,
      tone: "rose",
    },
    {
      label: "In review",
      value: formatNumber(recruitment.inReview),
      hint: "Applications still open",
      icon: ClipboardList,
      tone: "amber",
    },
  ]

  const leaveCards = [
    {
      label: "Pending leave",
      value: formatNumber(leave.pending),
      hint: "Awaiting a decision",
      icon: ClipboardList,
      tone: "amber",
    },
    {
      label: "Approved leave",
      value: formatNumber(leave.approved),
      hint: liveLeave ? "Approved requests" : "Approved in November",
      icon: CalendarCheck,
      tone: "emerald",
    },
    {
      label: "Rejected leave",
      value: formatNumber(leave.rejected),
      hint: liveLeave ? "Rejected requests" : "Declined in November",
      icon: CalendarX,
      tone: "rose",
    },
  ]

  const performanceCards = [
    {
      label: "Average performance",
      value: formatRating(summary.averagePerformance),
      hint: "Weighted by department headcount, out of 5",
      icon: Star,
      tone: "indigo",
    },
    {
      label: "Goal completion",
      value: formatPercent(summary.goalCompletion),
      hint: `${formatNumber(summary.goalsCompleted)} of ${formatNumber(summary.goalTotal)} goals completed`,
      icon: Target,
      tone: "blue",
    },
    {
      label: "Goals completed",
      value: formatNumber(summary.goalsCompleted),
      hint: "Closed in the current cycle",
      icon: CircleCheck,
      tone: "emerald",
    },
    {
      label: "Goals in progress",
      value: formatNumber(summary.goalsInProgress),
      hint: "Still underway",
      icon: CircleDashed,
      tone: "amber",
    },
    {
      label: "Goals not started",
      value: formatNumber(summary.goalsNotStarted),
      hint: "Assigned and not yet opened",
      icon: Flag,
      tone: "slate",
    },
  ]

  const feedbackCards = [
    {
      label: "Average feedback",
      value: formatRating(summary.averageFeedback),
      hint: `Mean of monthly scores, ${formatNumber(summary.feedbackResponses)} responses`,
      icon: MessageSquare,
      tone: "indigo",
    },
    {
      label: "Positive feedback",
      value: formatNumber(summary.positiveFeedback),
      hint: "Responses tagged positive",
      icon: ThumbsUp,
      tone: "emerald",
    },
    {
      label: "Neutral feedback",
      value: formatNumber(summary.neutralFeedback),
      hint: "Responses tagged neutral",
      icon: Minus,
      tone: "slate",
    },
    {
      label: "Negative feedback",
      value: formatNumber(summary.negativeFeedback),
      hint: "Responses tagged negative",
      icon: ThumbsDown,
      tone: "rose",
    },
  ]

  const exitCards = [
    {
      label: "Total exits",
      value: formatNumber(exitTotal),
      hint: live ? "Recorded exits, excluding cancelled" : "Separations in 2026",
      icon: DoorOpen,
      tone: "indigo",
    },
    {
      label: "Highest department attrition",
      value: topExitDept ? formatNumber(topExitDept.exits) : "—",
      hint: topExitDept ? topExitDept.name : "No exits recorded",
      icon: Building,
      tone: "rose",
    },
    {
      label: "Most common exit reason",
      value: topExitReasonRow ? formatNumber(topExitReasonRow.count) : "—",
      hint: topExitReasonRow ? topExitReasonRow.name : "No exits recorded",
      icon: Flag,
      tone: "amber",
    },
  ]

  const emptyChartNote = (text) => (
    <div className="flex h-full items-center justify-center text-sm text-[var(--text-secondary,#777D91)]">{text}</div>
  )

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-[var(--primary-hover,#8F87DC)] uppercase">
            PeoplePulse 360
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--text-main,#303447)] sm:text-3xl">
            HR Analytics
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary,#777D91)]">
            Headcount, hiring, attendance, leave, performance, feedback, and attrition for the central HR team.
          </p>
        </div>
        <p className="text-sm font-medium text-[var(--text-secondary,#777D91)]">As of {reportingPeriod.asOf}</p>
      </div>

      <DemoNotice />

      <div className="space-y-4">
        <MetricSection
          title="Workforce"
          description={
            liveWorkforce
              ? `${formatNumber(totalEmployees)} active employees across ${formatNumber(workforceDepartments.length)} departments. ${sourceLabel(true)}`
              : `Headcount and new hires. ${sourceLabel(false)}`
          }
          gridClassName="sm:grid-cols-2"
        >
          {workforceCards.map((card) => (
            <KpiCard key={card.label} {...card} />
          ))}
        </MetricSection>

        <div className="grid gap-4 xl:grid-cols-5">
          <ChartCard
            className="xl:col-span-3"
            heightClass="h-96"
            title="Employees by department"
            description={
              liveWorkforce
                ? "Active employees in each department, from the employees table. Resigned employees are not counted."
                : "Active employees in each department. The tooltip also shows who joined in November."
            }
          >
            <DepartmentHeadcountChart data={workforceDepartments} />
          </ChartCard>
          <ChartCard
            className="xl:col-span-2"
            heightClass="h-96"
            title={liveWorkforce ? "Employees by status" : "Employee distribution"}
            description={
              liveWorkforce
                ? `${formatNumber(workforceMixRows.reduce((sum, row) => sum + row.value, 0))} employees grouped by their current status.`
                : `${formatNumber(summary.employees)} people across full-time, contract, intern, and part-time engagement.`
            }
          >
            <EmployeeDistributionChart data={workforceMixRows} />
          </ChartCard>
        </div>
      </div>

      <div className="space-y-4">
        <MetricSection
          title="Attendance"
          description={
            liveAttendance
              ? `${formatNumber(attendance.present)} present, ${formatNumber(attendance.absent)} absent, and ${formatNumber(attendance.onLeave)} on leave today. ${sourceLabel(true)}`
              : `${formatNumber(summary.present)} present, ${formatNumber(summary.absent)} absent, and ${formatNumber(summary.onLeave)} on approved leave account for all ${formatNumber(summary.employees)} employees today. ${sourceLabel(false)}`
          }
          gridClassName="sm:grid-cols-2 xl:grid-cols-4"
        >
          {attendanceCards.map((card) => (
            <KpiCard key={card.label} {...card} />
          ))}
        </MetricSection>

        <ChartCard
          title="Monthly attendance"
          description={
            liveAttendanceTrend
              ? "Attendance rate for each month, from the attendance records. Live data from the database."
              : `${reportingPeriod.attendanceWindow}. The axis starts at 88% so month-to-month movement stays visible. November matches today's attendance rate. ${sourceLabel(false)}`
          }
        >
          <AttendanceTrendChart data={attendanceTrendRows} />
        </ChartCard>
      </div>

      <div className="space-y-4">
        <MetricSection
          title="Recruitment"
          description={
            liveRecruitment
              ? `${formatNumber(recruitment.applications)} applications from ${formatNumber(recruitment.candidates)} candidates. ${formatNumber(recruitment.selected)} selected, ${formatNumber(recruitment.rejected)} rejected, and ${formatNumber(recruitment.inReview)} in review. ${sourceLabel(true)}`
              : `${formatNumber(summary.applications)} applications from ${formatNumber(summary.candidates)} candidates. ${formatNumber(summary.selected)} were selected, ${formatNumber(summary.rejected)} were rejected, and ${formatNumber(summary.inReview)} remain in review. ${sourceLabel(false)}`
          }
        >
          {recruitmentCards.map((card) => (
            <KpiCard key={card.label} {...card} />
          ))}
        </MetricSection>

        <ChartCard
          title="Recruitment statistics"
          description={
            liveRecruitment
              ? "Applications, selected and rejected candidates by month, from the applications table."
              : "Applications use the left axis. Selected and rejected candidates use the right axis so both series stay readable. January through November 2026."
          }
        >
          {liveRecruitment && recruitmentTrendRows.length === 0 ? (
            emptyChartNote("No application dates recorded yet.")
          ) : (
            <RecruitmentChart data={recruitmentTrendRows} />
          )}
        </ChartCard>
      </div>

      <MetricSection
        title="Leave requests"
        description={liveLeave ? `Requests on record. ${sourceLabel(true)}` : `Requests recorded in November 2026. ${sourceLabel(false)}`}
      >
        {leaveCards.map((card) => (
          <KpiCard key={card.label} {...card} />
        ))}
      </MetricSection>

      <div className="space-y-4">
        <MetricSection
          title="Performance and goals"
          description="Ratings and goal status for the current review cycle. Sample data: the performance module has no database table yet."
          gridClassName="sm:grid-cols-2 xl:grid-cols-5"
        >
          {performanceCards.map((card) => (
            <KpiCard key={card.label} {...card} />
          ))}
        </MetricSection>

        <div className="grid gap-4 xl:grid-cols-2">
          <ChartCard
            heightClass="h-96"
            title="Performance by department"
            description={`Company average is ${formatRating(summary.averagePerformance)} on a 5-point scale. The axis starts at 3, and the dashed line marks that average.`}
          >
            <PerformanceChart data={departments} average={summary.averagePerformance} />
          </ChartCard>
          <ChartCard
            heightClass="h-96"
            title="Goal completion by department"
            description={`${formatPercent(summary.goalCompletion)} of ${formatNumber(summary.goalTotal)} goals are complete. Each bar splits completed, in progress, and not started.`}
          >
            <GoalCompletionChart data={departments} />
          </ChartCard>
        </div>
      </div>

      <div className="space-y-4">
        <MetricSection
          title="Feedback"
          description={`${formatNumber(summary.feedbackResponses)} responses in 2026. The average score is the mean of the monthly averages. Sample data: the feedback module has no database table yet.`}
          gridClassName="sm:grid-cols-2 xl:grid-cols-4"
        >
          {feedbackCards.map((card) => (
            <KpiCard key={card.label} {...card} />
          ))}
        </MetricSection>

        <div className="grid gap-4 xl:grid-cols-5">
          <ChartCard
            className="xl:col-span-2"
            heightClass="h-80"
            title="Feedback sentiment"
            description="Positive, neutral, and negative tags across the 2026 responses."
          >
            <FeedbackSentimentChart data={feedbackSentiment} />
          </ChartCard>
          <ChartCard
            className="xl:col-span-3"
            heightClass="h-80"
            title="Monthly feedback score"
            description="Average score by month on a 5-point scale. The axis starts at 3.8."
          >
            <FeedbackTrendChart data={feedbackTrend} />
          </ChartCard>
        </div>
      </div>

      <div className="space-y-4">
        <MetricSection title="Employee exits" description={`${exitSummaryText} ${exitSourceLabel}`}>
          {exitCards.map((card) => (
            <KpiCard key={card.label} {...card} />
          ))}
        </MetricSection>

        <div className="grid gap-4 xl:grid-cols-2">
          <ChartCard
            heightClass="h-96"
            title="Exits by department"
            description={
              live
                ? "Recorded exits for each department, from the exit records database. Cancelled processes are not counted."
                : "Separations recorded against each department in 2026. Design has none in this snapshot."
            }
          >
            {noExits ? emptyChartNote("No exit records yet.") : <DepartmentExitsChart data={exitDepartments} />}
          </ChartCard>
          <ChartCard
            heightClass="h-96"
            title="Common exit reasons"
            description="Reasons captured when employees left. Counts add up to the total exits."
          >
            {noExits ? emptyChartNote("No exit records yet.") : <ExitReasonChart data={exitReasonRows} />}
          </ChartCard>
        </div>
      </div>

      <p className="text-xs text-[var(--text-muted,#A0A4B2)]">
        PEOPLEPULSE 360 · HR Analytics · Sections marked "Sample data" use a demonstration snapshot as of{" "}
        {reportingPeriod.asOf}
      </p>
    </div>
  )
}