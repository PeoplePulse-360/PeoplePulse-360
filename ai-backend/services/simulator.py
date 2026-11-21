from models.simulator import (
    MetricComparison,
    SimulatorRequest,
    SimulatorResponse,
)

TRAINING_EFFICIENCY_GAIN = 0.20
DISCLAIMER = "These figures are simple planning estimates for an HR discussion."

ASSUMPTIONS = [
    "Pending tasks stay the same when people are hired.",
    "New hires are counted as untrained.",
    "A trained employee is estimated to take 20% less time per task.",
    "The team overtime total stays as entered.",
]

METRIC_LABELS = {
    "employee_count": "Employees",
    "pending_tasks": "Pending tasks",
    "weekly_hours_per_employee": "Weekly hours per employee",
    "trained_employee_count": "Trained employees",
    "tasks_per_employee": "Tasks per employee",
    "capacity_hours": "Capacity hours",
    "demand_hours": "Demand hours",
    "workload_ratio": "Workload ratio",
    "overtime_per_employee": "Overtime per employee",
    "trained_percentage": "Trained percentage",
}

LOWER_IS_BETTER = {
    "pending_tasks",
    "weekly_hours_per_employee",
    "tasks_per_employee",
    "demand_hours",
    "workload_ratio",
    "overtime_per_employee",
}
HIGHER_IS_BETTER = {"capacity_hours", "trained_percentage"}


def round_value(value: float) -> float:
    return round(value, 2)


def calculate_metrics(
    employee_count: int,
    pending_tasks: int,
    weekly_hours_per_employee: float,
    overtime_hours: float,
    average_task_hours: float,
    trained_employee_count: int,
) -> dict[str, float | int]:
    trained_share = trained_employee_count / employee_count
    effective_task_hours = average_task_hours * (
        1 - TRAINING_EFFICIENCY_GAIN * trained_share
    )
    capacity_hours = employee_count * weekly_hours_per_employee
    demand_hours = pending_tasks * effective_task_hours

    return {
        "employee_count": employee_count,
        "pending_tasks": pending_tasks,
        "weekly_hours_per_employee": round_value(weekly_hours_per_employee),
        "trained_employee_count": trained_employee_count,
        "tasks_per_employee": round_value(pending_tasks / employee_count),
        "capacity_hours": round_value(capacity_hours),
        "demand_hours": round_value(demand_hours),
        "workload_ratio": round_value(demand_hours / capacity_hours),
        "overtime_per_employee": round_value(overtime_hours / employee_count),
        "trained_percentage": round_value(trained_share * 100),
    }


def make_comparison(
    current: dict[str, float | int], simulated: dict[str, float | int]
) -> list[MetricComparison]:
    result = []
    for metric, label in METRIC_LABELS.items():
        before = float(current[metric])
        after = float(simulated[metric])
        difference = round_value(after - before)
        direction = "unchanged" if difference == 0 else "up" if difference > 0 else "down"

        if metric in LOWER_IS_BETTER:
            improved = difference < 0
        elif metric in HIGHER_IS_BETTER:
            improved = difference > 0
        else:
            improved = False

        result.append(
            MetricComparison(
                metric=metric,
                label=label,
                current=before,
                simulated=after,
                change=difference,
                direction=direction,
                improved=improved,
            )
        )
    return result


def make_scenario_name(request: SimulatorRequest) -> str:
    changes = request.changes
    descriptions = []
    if changes.hire_employees:
        descriptions.append(f"Hire {changes.hire_employees} employees")
    if changes.reassigned_tasks:
        descriptions.append(f"Reassign {changes.reassigned_tasks} tasks")
    if changes.weekly_hours_change:
        descriptions.append(f"Change weekly hours by {changes.weekly_hours_change:g}")
    if changes.additional_trained_employees:
        descriptions.append(f"Train {changes.additional_trained_employees} more employees")
    if not descriptions:
        return "Current situation"
    return descriptions[0] if len(descriptions) == 1 else "Combined scenario"


def analyse_simulator(request: SimulatorRequest) -> SimulatorResponse:
    baseline = request.current
    changes = request.changes

    current_result = calculate_metrics(
        employee_count=baseline.employee_count,
        pending_tasks=baseline.pending_tasks,
        weekly_hours_per_employee=baseline.weekly_hours_per_employee,
        overtime_hours=baseline.overtime_hours,
        average_task_hours=baseline.average_task_hours,
        trained_employee_count=baseline.trained_employee_count,
    )
    simulated_result = calculate_metrics(
        employee_count=baseline.employee_count + changes.hire_employees,
        pending_tasks=baseline.pending_tasks - changes.reassigned_tasks,
        weekly_hours_per_employee=(
            baseline.weekly_hours_per_employee + changes.weekly_hours_change
        ),
        overtime_hours=baseline.overtime_hours,
        average_task_hours=baseline.average_task_hours,
        trained_employee_count=(
            baseline.trained_employee_count + changes.additional_trained_employees
        ),
    )

    current_tasks = float(current_result["tasks_per_employee"])
    simulated_tasks = float(simulated_result["tasks_per_employee"])
    scenario_name = make_scenario_name(request)
    if simulated_tasks < current_tasks:
        summary = (
            f"{scenario_name} lowers the average load from {current_tasks:g} "
            f"to {simulated_tasks:g} tasks per employee."
        )
    elif simulated_tasks > current_tasks:
        summary = (
            f"{scenario_name} raises the average load from {current_tasks:g} "
            f"to {simulated_tasks:g} tasks per employee."
        )
    else:
        summary = f"{scenario_name} leaves the average load at {current_tasks:g} tasks per employee."

    return SimulatorResponse(
        scenario_name=scenario_name,
        assumptions=ASSUMPTIONS,
        current=current_result,
        simulated=simulated_result,
        comparison=make_comparison(current_result, simulated_result),
        summary=summary,
        disclaimer=DISCLAIMER,
    )
