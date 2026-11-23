from typing import Literal

from pydantic import BaseModel, Field, model_validator

Direction = Literal["up", "down", "unchanged"]


class CurrentSituation(BaseModel):
    employee_count: int = Field(ge=1)
    pending_tasks: int = Field(ge=0)
    weekly_hours_per_employee: float = Field(gt=0)
    overtime_hours: float = Field(ge=0)
    average_task_hours: float = Field(gt=0)
    trained_employee_count: int = Field(ge=0)

    @model_validator(mode="after")
    def training_count_fits_team(self):
        if self.trained_employee_count > self.employee_count:
            raise ValueError("trained_employee_count cannot exceed employee_count")
        return self


class ScenarioChanges(BaseModel):
    hire_employees: int = Field(default=0, ge=0)
    reassigned_tasks: int = Field(default=0, ge=0)
    weekly_hours_change: float = 0
    additional_trained_employees: int = Field(default=0, ge=0)


class SimulatorRequest(BaseModel):
    current: CurrentSituation
    changes: ScenarioChanges = Field(default_factory=ScenarioChanges)

    @model_validator(mode="after")
    def scenario_values_are_possible(self):
        if self.changes.reassigned_tasks > self.current.pending_tasks:
            raise ValueError("reassigned_tasks cannot exceed pending_tasks")

        if self.current.weekly_hours_per_employee + self.changes.weekly_hours_change <= 0:
            raise ValueError("weekly hours after the change must be greater than 0")

        available_to_train = (
            self.current.employee_count
            - self.current.trained_employee_count
            + self.changes.hire_employees
        )
        if self.changes.additional_trained_employees > available_to_train:
            raise ValueError(
                "additional_trained_employees cannot exceed the number of untrained employees"
            )
        return self


class MetricComparison(BaseModel):
    metric: str
    label: str
    current: float
    simulated: float
    change: float
    direction: Direction
    improved: bool


class SimulatorResponse(BaseModel):
    scenario_name: str
    assumptions: list[str]
    current: dict[str, float | int]
    simulated: dict[str, float | int]
    comparison: list[MetricComparison]
    summary: str
    disclaimer: str
