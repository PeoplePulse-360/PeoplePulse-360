import pandas as pd

from models.workload import (
    DepartmentWorkloadInput,
    DepartmentWorkloadResult,
    WorkloadEmployeeInput,
    WorkloadEmployeeResult,
    WorkloadIndicator,
    WorkloadRequest,
    WorkloadResponse,
)

DISCLAIMER = "These are workload indicators for HR review, not proof of the cause."
POINTS = {"moderate": 12, "high": 25}

EMPLOYEE_RECOMMENDATIONS = {
    "overtime": "Review this employee's overtime with their manager.",
    "pending_tasks": "Review this employee's pending tasks and move or reassign work.",
    "deadline_extensions": "Look at this employee's extended deadlines and reset the due dates that matter.",
    "attendance": "Check whether this employee's absences line up with a heavy workload.",
    "complaints": "Talk with this employee about the workload complaints they raised.",
    "feedback": "Read this employee's feedback with their manager and agree one workload change.",
}

DEPARTMENT_RECOMMENDATIONS = {
    "overtime": "Review overtime in {department} and redistribute work where the same people are staying late.",
    "pending_tasks": "Redistribute pending tasks in {department} or review staffing.",
    "deadline_extensions": "Review repeated deadline extensions in {department} and reset priorities.",
    "attendance": "Compare absence in {department} with the current workload.",
    "complaints": "Read the workload complaints from {department} and agree one change with the team.",
    "feedback": "Review low workload feedback in {department} with the manager.",
}


def format_number(value: float) -> str:
    number = float(value)
    if number.is_integer():
        return str(int(number))
    return f"{number:.2f}".rstrip("0").rstrip(".")


def level_for_high_values(value: float | None, moderate: float, high: float) -> str | None:
    """Higher numbers are a heavier workload."""
    if value is None or pd.isna(value):
        return None
    if value >= high:
        return "high"
    if value >= moderate:
        return "moderate"
    return None


def level_for_low_score(value: float | None) -> str | None:
    """Lower feedback scores need more attention."""
    if value is None or pd.isna(value):
        return None
    if value <= 2.5:
        return "high"
    if value <= 3.5:
        return "moderate"
    return None


def overall_level(indicators: list[WorkloadIndicator]) -> str:
    if any(item.attention_level == "high" for item in indicators):
        return "high"
    if any(item.attention_level == "moderate" for item in indicators):
        return "moderate"
    return "low"


def build_employee_frame(employees: list[WorkloadEmployeeInput]) -> pd.DataFrame:
    """One row per employee. Absence is left empty when no days were recorded."""
    rows = []
    for employee in employees:
        rows.append(
            {
                "overtime_hours": employee.overtime_hours,
                "pending_tasks": employee.pending_tasks,
                "deadline_extensions": employee.deadline_extensions,
                "total_days": employee.total_days,
                "absent_days": employee.absent_days,
                "absence_rate": (
                    employee.absent_days / employee.total_days if employee.total_days else None
                ),
                "workload_complaints": employee.workload_complaints,
                "feedback_score": employee.feedback_score,
            }
        )
    return pd.DataFrame(rows)


def add_indicator(
    indicators: list[WorkloadIndicator],
    area: str,
    level: str | None,
    reason: str,
) -> None:
    if level is not None:
        indicators.append(
            WorkloadIndicator(area=area, attention_level=level, reason=reason)
        )


def employee_indicators(row: pd.Series) -> list[WorkloadIndicator]:
    indicators: list[WorkloadIndicator] = []
    add_indicator(
        indicators,
        "overtime",
        level_for_high_values(row["overtime_hours"], 10, 20),
        f"Overtime is {format_number(row['overtime_hours'])} hours in this period.",
    )
    add_indicator(
        indicators,
        "pending_tasks",
        level_for_high_values(row["pending_tasks"], 8, 15),
        f"{int(row['pending_tasks'])} tasks are still pending.",
    )
    add_indicator(
        indicators,
        "deadline_extensions",
        level_for_high_values(row["deadline_extensions"], 2, 4),
        f"{int(row['deadline_extensions'])} deadlines were extended in this period.",
    )
    if not pd.isna(row["absence_rate"]):
        add_indicator(
            indicators,
            "attendance",
            level_for_high_values(row["absence_rate"], 0.10, 0.20),
            (
                f"Absent on {int(row['absent_days'])} of {int(row['total_days'])} recorded days "
                f"({row['absence_rate']:.0%})."
            ),
        )
    complaints = int(row["workload_complaints"])
    complaint_level = level_for_high_values(complaints, 1, 2)
    if complaint_level is not None:
        noun = "complaint was" if complaints == 1 else "complaints were"
        add_indicator(
            indicators,
            "complaints",
            complaint_level,
            f"{complaints} workload {noun} recorded.",
        )
    if not pd.isna(row["feedback_score"]):
        add_indicator(
            indicators,
            "feedback",
            level_for_low_score(row["feedback_score"]),
            f"Feedback score is {format_number(row['feedback_score'])} out of 5.",
        )
    return indicators


def score_employee(employee: WorkloadEmployeeInput, row: pd.Series) -> WorkloadEmployeeResult:
    indicators = employee_indicators(row)
    return WorkloadEmployeeResult(
        employee_id=employee.employee_id,
        full_name=employee.full_name,
        attention_level=overall_level(indicators),
        indicator_score=min(100, sum(POINTS[item.attention_level] for item in indicators)),
        indicators=indicators,
        recommendations=[EMPLOYEE_RECOMMENDATIONS[item.area] for item in indicators],
    )


def count_flagged(frame: pd.DataFrame, column: str, threshold: float, *, low_is_worse: bool = False) -> tuple[int, int]:
    valid = frame[column].dropna()
    if low_is_worse:
        flagged = int((valid <= threshold).sum())
    else:
        flagged = int((valid >= threshold).sum())
    return flagged, int(valid.shape[0])


def department_indicators(department: str, frame: pd.DataFrame) -> list[WorkloadIndicator]:
    indicators: list[WorkloadIndicator] = []
    employee_count = int(frame.shape[0])

    overtime_average = float(frame["overtime_hours"].mean())
    overtime_flagged, overtime_total = count_flagged(frame, "overtime_hours", 10)
    add_indicator(
        indicators,
        "overtime",
        level_for_high_values(overtime_average, 10, 20),
        (
            f"Average overtime is {format_number(overtime_average)} hours. "
            f"{overtime_flagged} of {overtime_total} employees is at or above 10 hours."
        ),
    )

    pending_average = float(frame["pending_tasks"].mean())
    pending_flagged, pending_total = count_flagged(frame, "pending_tasks", 8)
    add_indicator(
        indicators,
        "pending_tasks",
        level_for_high_values(pending_average, 8, 15),
        (
            f"Average pending tasks are {format_number(pending_average)}. "
            f"{pending_flagged} of {pending_total} employees has 8 or more."
        ),
    )

    extension_average = float(frame["deadline_extensions"].mean())
    extension_flagged, extension_total = count_flagged(frame, "deadline_extensions", 2)
    add_indicator(
        indicators,
        "deadline_extensions",
        level_for_high_values(extension_average, 2, 4),
        (
            f"Average deadline extensions are {format_number(extension_average)}. "
            f"{extension_flagged} of {extension_total} employees has 2 or more."
        ),
    )

    recorded_attendance = frame[frame["total_days"] > 0]
    if not recorded_attendance.empty:
        absence_average = float(recorded_attendance["absence_rate"].mean())
        absence_flagged, absence_total = count_flagged(recorded_attendance, "absence_rate", 0.10)
        add_indicator(
            indicators,
            "attendance",
            level_for_high_values(absence_average, 0.10, 0.20),
            (
                f"Average absence is {absence_average:.0%}. "
                f"{absence_flagged} of {absence_total} employees with attendance recorded is at or above 10%."
            ),
        )

    complaint_average = float(frame["workload_complaints"].sum()) / employee_count
    complaint_flagged, complaint_total = count_flagged(frame, "workload_complaints", 1)
    add_indicator(
        indicators,
        "complaints",
        level_for_high_values(complaint_average, 1, 2),
        (
            f"Workload complaints average {format_number(complaint_average)} per employee. "
            f"{complaint_flagged} of {complaint_total} employees has at least one complaint."
        ),
    )

    scored_feedback = frame["feedback_score"].dropna()
    if not scored_feedback.empty:
        feedback_average = float(scored_feedback.mean())
        feedback_flagged, feedback_total = count_flagged(
            frame, "feedback_score", 3.5, low_is_worse=True
        )
        add_indicator(
            indicators,
            "feedback",
            level_for_low_score(feedback_average),
            (
                f"Average feedback score is {format_number(feedback_average)} out of 5. "
                f"{feedback_flagged} of {feedback_total} scored employees is at or below 3.5."
            ),
        )

    return indicators


def department_summary(department: str, level: str, indicators: list[WorkloadIndicator]) -> str:
    if not indicators:
        return f"{department} shows no workload imbalance in this period."
    if level == "high":
        return f"{department} shows possible workload imbalance."
    return f"{department} has some workload signals worth a check."


def score_department(department: DepartmentWorkloadInput) -> DepartmentWorkloadResult:
    frame = build_employee_frame(department.employees)
    employees = [
        score_employee(employee, row)
        for employee, (_, row) in zip(department.employees, frame.iterrows())
    ]
    indicators = department_indicators(department.department, frame)
    level = overall_level(indicators)
    return DepartmentWorkloadResult(
        department=department.department,
        attention_level=level,
        indicator_score=min(100, sum(POINTS[item.attention_level] for item in indicators)),
        employee_count=len(employees),
        flagged_employee_count=sum(employee.attention_level != "low" for employee in employees),
        summary=department_summary(department.department, level, indicators),
        indicators=indicators,
        recommendations=[
            DEPARTMENT_RECOMMENDATIONS[item.area].format(department=department.department)
            for item in indicators
        ],
        employees=employees,
    )


def analyse_workload(payload: WorkloadRequest) -> WorkloadResponse:
    return WorkloadResponse(
        period_days=payload.period_days,
        departments=[score_department(department) for department in payload.departments],
        disclaimer=DISCLAIMER,
    )