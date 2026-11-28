from typing import Literal

from pydantic import BaseModel, Field, model_validator


AttentionLevel = Literal["low", "moderate", "high"]


class AttendanceInput(BaseModel):
    total_days: int = Field(ge=0)
    present_days: int = Field(ge=0)
    absent_days: int = Field(ge=0)
    late_days: int = Field(ge=0)
    half_days: int = Field(ge=0)

    @model_validator(mode="after")
    def counts_fit_total(self):
        counted = self.present_days + self.absent_days + self.late_days + self.half_days
        if counted > self.total_days:
            raise ValueError(
                "present, absent, late, and half days cannot add up to more than total_days"
            )
        return self


class LeaveInput(BaseModel):
    pending_requests: int = Field(ge=0)
    approved_days_last_90: int = Field(ge=0)


class OnboardingInput(BaseModel):
    total_tasks: int = Field(ge=0)
    completed_tasks: int = Field(ge=0)

    @model_validator(mode="after")
    def completed_fit_total(self):
        if self.completed_tasks > self.total_tasks:
            raise ValueError("completed_tasks cannot be greater than total_tasks")
        return self


class GoalsInput(BaseModel):
    total_goals: int = Field(ge=0)
    completed_goals: int = Field(ge=0)
    average_progress: int = Field(ge=0, le=100)

    @model_validator(mode="after")
    def completed_fit_total(self):
        if self.completed_goals > self.total_goals:
            raise ValueError("completed_goals cannot be greater than total_goals")
        return self


class FeedbackInput(BaseModel):
    average_score: float = Field(ge=0, le=5)
    response_count: int = Field(ge=0)


class GrievanceInput(BaseModel):
    open_count: int = Field(ge=0)


class EmployeeJourneyInput(BaseModel):
    employee_id: str = Field(pattern=r"^EMP-?\d{3,}$")
    full_name: str = Field(min_length=1)
    department: str = Field(min_length=1)
    attendance: AttendanceInput | None = None
    leave: LeaveInput | None = None
    onboarding: OnboardingInput | None = None
    performance_ratings: list[float] = Field(default_factory=list)
    goals: GoalsInput | None = None
    feedback: FeedbackInput | None = None
    grievances: GrievanceInput | None = None

    @model_validator(mode="after")
    def ratings_are_on_scale(self):
        for rating in self.performance_ratings:
            if rating < 1 or rating > 5:
                raise ValueError("each performance rating must be from 1 to 5")
        return self


class JourneyRequest(BaseModel):
    employees: list[EmployeeJourneyInput] = Field(min_length=1)


class Indicator(BaseModel):
    area: str
    attention_level: AttentionLevel
    reason: str


class EmployeeJourneyResult(BaseModel):
    employee_id: str
    full_name: str
    department: str
    attention_level: AttentionLevel
    indicator_score: int = Field(ge=0, le=100)
    summary: str
    indicators: list[Indicator]
    recommendations: list[str]
    disclaimer: str


class JourneyResponse(BaseModel):
    results: list[EmployeeJourneyResult]
    count: int
