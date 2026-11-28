from typing import Literal

from pydantic import BaseModel, Field, model_validator


AttentionLevel = Literal["low", "moderate", "high"]


class WorkloadEmployeeInput(BaseModel):
    employee_id: str = Field(pattern=r"^EMP-?\d{3,}$")
    full_name: str = Field(min_length=1)
    overtime_hours: float | None = Field(default=None, ge=0)
    pending_tasks: int | None = Field(default=None, ge=0)
    deadline_extensions: int | None = Field(default=None, ge=0)
    total_days: int = Field(default=0, ge=0)
    absent_days: int = Field(default=0, ge=0)
    workload_complaints: int | None = Field(default=None, ge=0)
    feedback_score: float | None = None

    @model_validator(mode="after")
    def attendance_and_feedback_fit(self):
        if self.absent_days > self.total_days:
            raise ValueError("absent_days cannot be greater than total_days")
        if self.feedback_score is not None and not 1 <= self.feedback_score <= 5:
            raise ValueError("feedback_score must be from 1 to 5")
        return self


class DepartmentWorkloadInput(BaseModel):
    department: str = Field(min_length=1)
    employees: list[WorkloadEmployeeInput] = Field(min_length=1)


class WorkloadRequest(BaseModel):
    period_days: int = Field(ge=1)
    departments: list[DepartmentWorkloadInput] = Field(min_length=1)


class WorkloadIndicator(BaseModel):
    area: str
    attention_level: AttentionLevel
    reason: str


class WorkloadEmployeeResult(BaseModel):
    employee_id: str
    full_name: str
    attention_level: AttentionLevel
    indicator_score: int = Field(ge=0, le=100)
    indicators: list[WorkloadIndicator]
    recommendations: list[str]


class DepartmentWorkloadResult(BaseModel):
    department: str
    attention_level: AttentionLevel
    indicator_score: int = Field(ge=0, le=100)
    employee_count: int = Field(ge=0)
    flagged_employee_count: int = Field(ge=0)
    summary: str
    indicators: list[WorkloadIndicator]
    recommendations: list[str]
    employees: list[WorkloadEmployeeResult]


class WorkloadResponse(BaseModel):
    period_days: int
    departments: list[DepartmentWorkloadResult]
    disclaimer: str
