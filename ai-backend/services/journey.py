import pandas as pd

from models.journey import (
    EmployeeJourneyInput,
    EmployeeJourneyResult,
    Indicator,
    JourneyRequest,
    JourneyResponse,
)

DISCLAIMER = (
    "These are indicators for HR review, not predictions of behaviour or resignation."
)

POINTS = {"moderate": 12, "high": 25}

RECOMMENDATIONS = {
    "attendance": "Review recent attendance with the employee and confirm whether schedule or health support is needed.",
    "leave": "Review pending leave requests and recent leave usage with the manager.",
    "onboarding": "Review onboarding support with the employee and their manager.",
    "performance": "Discuss the latest performance review and agree a short support plan.",
    "goals": "Review goal progress and remove blockers with the employee.",
    "feedback": "Read recent feedback with the employee and agree one or two improvements.",
    "grievances": "Follow up on open grievances and record the next action.",
}


def build_feature_frame(employees: list[EmployeeJourneyInput]) -> pd.DataFrame:
    """Turn each employee into one row of rates. Missing sections stay empty."""
    rows = []
    for employee in employees:
        attendance = employee.attendance
        leave = employee.leave
        onboarding = employee.onboarding
        goals = employee.goals
        feedback = employee.feedback
        grievances = employee.grievances
        ratings = employee.performance_ratings

        total_days = attendance.total_days if attendance else None
        absent_days = attendance.absent_days if attendance else None
        late_days = attendance.late_days if attendance else None
        total_tasks = onboarding.total_tasks if onboarding else None
        completed_tasks = onboarding.completed_tasks if onboarding else None

        rows.append(
            {
                "total_days": total_days,
                "absent_days": absent_days,
                "late_days": late_days,
                "absence_rate": (absent_days / total_days) if total_days else None,
                "late_rate": (late_days / total_days) if total_days else None,
                "approved_days_last_90": leave.approved_days_last_90 if leave else None,
                "pending_requests": leave.pending_requests if leave else None,
                "total_tasks": total_tasks,
                "completed_tasks": completed_tasks,
                "incomplete_rate": (
                    (total_tasks - completed_tasks) / total_tasks if total_tasks else None
                ),
                "latest_rating": ratings[-1] if ratings else None,
                "previous_rating": ratings[-2] if len(ratings) >= 2 else None,
                "average_progress": goals.average_progress if goals and goals.total_goals else None,
                "average_score": (
                    feedback.average_score if feedback and feedback.response_count else None
                ),
                "open_grievances": grievances.open_count if grievances else None,
            }
        )
    return pd.DataFrame(rows)


def stronger(current: str | None, candidate: str) -> str:
    rank = {None: 0, "moderate": 1, "high": 2}
    if rank[candidate] > rank[current]:
        return candidate
    return current


def raise_one_step(level: str | None) -> str:
    if level == "high":
        return "high"
    if level == "moderate":
        return "high"
    return "moderate"


def attendance_indicator(row: pd.Series) -> Indicator | None:
    if pd.isna(row["absence_rate"]):
        return None
    level = None
    if row["absence_rate"] >= 0.20 or row["late_rate"] >= 0.15:
        level = "high"
    elif row["absence_rate"] >= 0.10 or row["late_rate"] >= 0.08:
        level = "moderate"
    if level is None:
        return None
    reason = (
        f"Absent on {int(row['absent_days'])} of {int(row['total_days'])} recorded days "
        f"({row['absence_rate']:.0%}), with {int(row['late_days'])} late days."
    )
    return Indicator(area="attendance", attention_level=level, reason=reason)


def leave_indicator(row: pd.Series) -> Indicator | None:
    if pd.isna(row["approved_days_last_90"]) and pd.isna(row["pending_requests"]):
        return None
    level = None
    details = []
    days = row["approved_days_last_90"]
    pending = row["pending_requests"]
    if not pd.isna(days) and days >= 8:
        level = "high" if days >= 15 else "moderate"
        details.append(f"{int(days)} leave days were approved in the last 90 days")
    if not pd.isna(pending) and pending >= 2:
        level = stronger(level, "high" if pending >= 4 else "moderate")
        details.append(f"{int(pending)} leave requests are still pending")
    if level is None:
        return None
    return Indicator(
        area="leave",
        attention_level=level,
        reason=f"{'; '.join(details)}.",
    )


def onboarding_indicator(row: pd.Series) -> Indicator | None:
    if pd.isna(row["incomplete_rate"]) or row["incomplete_rate"] <= 0:
        return None
    level = "high" if row["incomplete_rate"] >= 0.50 else "moderate"
    incomplete = int(row["total_tasks"] - row["completed_tasks"])
    reason = (
        f"{incomplete} of {int(row['total_tasks'])} onboarding tasks are still incomplete."
    )
    return Indicator(area="onboarding", attention_level=level, reason=reason)


def performance_indicator(row: pd.Series) -> Indicator | None:
    if pd.isna(row["latest_rating"]):
        return None
    latest = float(row["latest_rating"])
    level = None
    if latest <= 2.5:
        level = "high"
    elif latest <= 3.5:
        level = "moderate"
    drop = None
    if not pd.isna(row["previous_rating"]):
        drop = float(row["previous_rating"]) - latest
        if drop >= 1:
            level = raise_one_step(level)
    if level is None:
        return None
    if drop is not None and drop >= 1:
        reason = (
            f"Latest rating is {latest:.1f} out of 5, down from {float(row['previous_rating']):.1f}."
        )
    else:
        reason = f"Latest rating is {latest:.1f} out of 5."
    return Indicator(area="performance", attention_level=level, reason=reason)


def goals_indicator(row: pd.Series) -> Indicator | None:
    if pd.isna(row["average_progress"]):
        return None
    progress = int(row["average_progress"])
    if progress <= 30:
        level = "high"
    elif progress <= 50:
        level = "moderate"
    else:
        return None
    return Indicator(
        area="goals",
        attention_level=level,
        reason=f"Average goal progress is {progress}%.",
    )


def feedback_indicator(row: pd.Series) -> Indicator | None:
    if pd.isna(row["average_score"]):
        return None
    score = float(row["average_score"])
    if score <= 2.5:
        level = "high"
    elif score <= 3.5:
        level = "moderate"
    else:
        return None
    return Indicator(
        area="feedback",
        attention_level=level,
        reason=f"Average feedback score is {score:.1f} out of 5.",
    )


def grievance_indicator(row: pd.Series) -> Indicator | None:
    if pd.isna(row["open_grievances"]) or row["open_grievances"] <= 0:
        return None
    open_count = int(row["open_grievances"])
    level = "high" if open_count >= 2 else "moderate"
    noun = "grievance is" if open_count == 1 else "grievances are"
    return Indicator(
        area="grievances",
        attention_level=level,
        reason=f"{open_count} {noun} still open.",
    )


def overall_level(indicators: list[Indicator]) -> str:
    if any(item.attention_level == "high" for item in indicators):
        return "high"
    if any(item.attention_level == "moderate" for item in indicators):
        return "moderate"
    return "low"


def summary_for(level: str, indicators: list[Indicator]) -> str:
    if not indicators:
        return "No work-record indicators need HR attention right now."
    if level == "high":
        return "Work records need HR review."
    return "Some work records are worth a check."


def score_employee(employee: EmployeeJourneyInput, row: pd.Series) -> EmployeeJourneyResult:
    builders = (
        attendance_indicator,
        leave_indicator,
        onboarding_indicator,
        performance_indicator,
        goals_indicator,
        feedback_indicator,
        grievance_indicator,
    )
    indicators = []
    for build in builders:
        indicator = build(row)
        if indicator is not None:
            indicators.append(indicator)

    score = min(100, sum(POINTS[item.attention_level] for item in indicators))
    level = overall_level(indicators)
    recommendations = [RECOMMENDATIONS[item.area] for item in indicators]

    return EmployeeJourneyResult(
        employee_id=employee.employee_id,
        full_name=employee.full_name,
        department=employee.department,
        attention_level=level,
        indicator_score=score,
        summary=summary_for(level, indicators),
        indicators=indicators,
        recommendations=recommendations,
        disclaimer=DISCLAIMER,
    )


def analyse_journey(payload: JourneyRequest) -> JourneyResponse:
    frame = build_feature_frame(payload.employees)
    results = [
        score_employee(employee, row)
        for employee, (_, row) in zip(payload.employees, frame.iterrows())
    ]
    return JourneyResponse(results=results, count=len(results))