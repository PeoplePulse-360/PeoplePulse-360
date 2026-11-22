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
import { formatNumber, formatPercent, formatRating } from "../utils/format"

export default function AnalyticsDashboard() {
  useEffect(() => {
    document.title = "HR Analytics · PEOPLEPULSE 360"
  }, [])

  // Exit analytics: live Supabase data when signed in, demo data otherwise.
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
               ? `Could not load live exit data (${exitLive.error}), so demonstration data is shown.`
        : "Demonstration data. Sign in on the Exit Management page to see live numbers."

  const exitSummaryText = noExits
    ? "No exits have been recorded yet."
    : `${formatNumber(exitTotal)} ${live ? "exits recorded" : "separations in 2026"}. ${topExitDept ? topExitDept.name : "No department"} accounts for ${formatNumber(topExitDept ? topExitDept.exits : 0)}, and ${topExitReasonRow ? topExitReasonRow.name.toLowerCase() : "no reason"} is the most common reason.`

  const workforceCards = [
    {
      label: "Total employees",
      value: formatNumber(summary.employees),
      hint: "Active headcount",
      icon: Users,
      tone: "indigo",
    },
    {
      label: "New employees",
      value: formatNumber(summary.newEmployees),
      hint: "Joined in November 2026",
      icon: UserPlus,
      tone: "blue",
    },
    {
      label: "Attendance",
      value: formatPercent(summary.attendanceRate),
      hint: "Present divided by people scheduled today",
      icon: Percent,
      tone: "indigo",
    },
    {
      label: "Present",
      value: formatNumber(summary.present),
      hint: "Marked present today",
      icon: UserCheck,
      tone: "emerald",
    },
    {
      label: "Absent",
      value: formatNumber(summary.absent),
      hint: "Unplanned absence today",
      icon: UserX,
      tone: "rose",
    },
    {
      label: "On leave",
      value: formatNumber(summary.onLeave),
      hint: "Approved leave today",
      icon: CalendarOff,
      tone: "amber",
    },
  ]

  const recruitmentCards = [
    {
      label: "Job openings",
      value: formatNumber(summary.openings),
      hint: "Open requisitions",
      icon: Briefcase,
      tone: "indigo",
    },
    {
      label: "Candidates",
      value: formatNumber(summary.candidates),
      hint: "Unique applicants, 2026",
      icon: Users,
      tone: "blue",
    },
    {
      label: "Applications received",
      value: formatNumber(summary.applications),
      hint: "Submissions in 2026",
      icon: FileText,
      tone: "indigo",
    },
    {
      label: "Selected",
      value: formatNumber(summary.selected),
      hint: "Offers accepted in 2026",
      icon: UserCheck,
      tone: "emerald",
    },
    {
      label: "Rejected",
      value: formatNumber(summary.rejected),
      hint: "Closed without an offer in 2026",
      icon: UserX,
      tone: "rose",
    },
    {
      label: "In review",
      value: formatNumber(summary.inReview),
      hint: "Applications still open",
      icon: ClipboardList,
      tone: "amber",
    },
  ]

  const leaveCards = [
    {
      label: "Pending leave",
      value: formatNumber(summary.leavePending),
      hint: "Awaiting a decision",
      icon: ClipboardList,
      tone: "amber",
    },
    {
      label: "Approved leave",
      value: formatNumber(summary.leaveApproved),
      hint: "Approved in November",
      icon: CalendarCheck,
      tone: "emerald",
    },
    {
      label: "Rejected leave",
      value: formatNumber(summary.leaveRejected),
      hint: "Declined in November",
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

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-indigo-600 uppercase">PeoplePulse 360</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">HR Analytics</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Headcount, hiring, attendance, leave, performance, feedback, and attrition for the central HR team.
          </p>
        </div>
        <p className="text-sm font-medium text-slate-500">As of {reportingPeriod.asOf}</p>
      </div>

      <DemoNotice />

      <div className="space-y-4">
        <MetricSection
          title="Workforce"
          description={`${formatNumber(summary.present)} present, ${formatNumber(summary.absent)} absent, and ${formatNumber(summary.onLeave)} on approved leave account for all ${formatNumber(summary.employees)} employees today.`}
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
            description="Active employees in each department. The tooltip also shows who joined in November."
          >
            <DepartmentHeadcountChart data={departments} />
          </ChartCard>
          <ChartCard
            className="xl:col-span-2"
            heightClass="h-96"
            title="Employee distribution"
            description={`${formatNumber(summary.employees)} people across full-time, contract, intern, and part-time engagement.`}
          >
            <EmployeeDistributionChart data={workforceMix} />
          </ChartCard>
        </div>

        <ChartCard
          title="Monthly attendance"
          description={`${reportingPeriod.attendanceWindow}. The axis starts at 88% so month-to-month movement stays visible. November matches today's attendance rate.`}
        >
          <AttendanceTrendChart data={monthlyAttendance} />
        </ChartCard>
      </div>

      <div className="space-y-4">
        <MetricSection
          title="Recruitment"
          description={`${formatNumber(summary.applications)} applications from ${formatNumber(summary.candidates)} candidates. ${formatNumber(summary.selected)} were selected, ${formatNumber(summary.rejected)} were rejected, and ${formatNumber(summary.inReview)} remain in review.`}
        >
          {recruitmentCards.map((card) => (
            <KpiCard key={card.label} {...card} />
          ))}
        </MetricSection>

        <ChartCard
          title="Recruitment statistics"
          description="Applications use the left axis. Selected and rejected candidates use the right axis so both series stay readable. January through November 2026."
        >
          <RecruitmentChart data={recruitmentTrend} />
        </ChartCard>
      </div>

      <MetricSection title="Leave requests" description="Requests recorded in November 2026.">
        {leaveCards.map((card) => (
          <KpiCard key={card.label} {...card} />
        ))}
      </MetricSection>

      <div className="space-y-4">
        <MetricSection
          title="Performance and goals"
          description="Ratings and goal status for the current review cycle."
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
          description={`${formatNumber(summary.feedbackResponses)} responses in 2026. The average score is the mean of the monthly averages.`}
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
            {noExits ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">
                No exit records yet.
              </div>
            ) : (
              <DepartmentExitsChart data={exitDepartments} />
            )}
          </ChartCard>
          <ChartCard
            heightClass="h-96"
            title="Common exit reasons"
            description="Reasons captured when employees left. Counts add up to the total exits."
          >
            {noExits ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">
                No exit records yet.
              </div>
            ) : (
              <ExitReasonChart data={exitReasonRows} />
            )}
          </ChartCard>
        </div>
      </div>

      <p className="text-xs text-slate-400">
        PEOPLEPULSE 360 · HR Analytics · Demonstration snapshot as of {reportingPeriod.asOf}
      </p>
    </div>
  )
}