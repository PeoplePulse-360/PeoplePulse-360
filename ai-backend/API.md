# PeoplePulse 360 AI API

Base URL for local development: `http://127.0.0.1:8000`

All request and response bodies use JSON. Interactive schemas are available at `/docs` while the FastAPI server is running. Invalid payloads return HTTP `422` with field validation details.

## `POST /api/ai/journey`

Analyses employee work records and returns explainable attention indicators. The employee list must contain at least one record. Optional data sections can be omitted; missing information is not treated as a risk signal.

Example request:

```json
{
  "employees": [
    {
      "employee_id": "EMP001",
      "full_name": "Asha Rao",
      "department": "Engineering",
      "attendance": {"total_days": 20, "present_days": 14, "absent_days": 4, "late_days": 2, "half_days": 0},
      "leave": {"pending_requests": 1, "approved_days_last_90": 6},
      "onboarding": {"total_tasks": 5, "completed_tasks": 2},
      "performance_ratings": [4.0, 2.5],
      "goals": {"total_goals": 3, "completed_goals": 0, "average_progress": 25},
      "feedback": {"average_score": 2.2, "response_count": 4},
      "grievances": {"open_count": 1}
    }
  ]
}
```

Each result includes the employee identity, `attention_level` (`low`, `moderate`, `high`), a 0–100 indicator score, indicators with reasons, recommendations, and a disclaimer. Threshold signals contribute 12 points for moderate or 25 for high, with the sum capped at 100. This is an HR review aid, not a prediction of behaviour or resignation.

## `POST /api/ai/workload`

Analyses employees within departments and returns both employee-level signals and department summaries. Counts and hours must be nonnegative; feedback scores must be from 1 to 5; absent days cannot exceed recorded days.

Example request:

```json
{
  "period_days": 30,
  "departments": [
    {
      "department": "Engineering",
      "employees": [
        {
          "employee_id": "EMP001",
          "full_name": "Asha Rao",
          "overtime_hours": 28,
          "pending_tasks": 18,
          "deadline_extensions": 4,
          "total_days": 20,
          "absent_days": 4,
          "workload_complaints": 2,
          "feedback_score": 2.4
        }
      ]
    }
  ]
}
```

The response contains department and employee attention levels, scores, indicator reasons, recommendations, counts of flagged employees, and a disclaimer. Employee thresholds: overtime 10/20 hours; pending tasks 8/15; extensions 2/4; absence rate 10%/20%; complaints 1/2; feedback scores 3.5/2.5 (lower is more concerning). The first value is the moderate threshold and the second is high. Department levels apply those thresholds to department averages; complaint averages are total complaints per employee. Department scores are capped at 100.

## `POST /api/ai/simulator`

Compares a current workforce baseline with changes. `changes` may be omitted; omitted values are treated as zero.

Example request:

```json
{
  "current": {
    "employee_count": 10,
    "pending_tasks": 100,
    "weekly_hours_per_employee": 40,
    "overtime_hours": 20,
    "average_task_hours": 4,
    "trained_employee_count": 4
  },
  "changes": {
    "hire_employees": 2,
    "reassigned_tasks": 0,
    "weekly_hours_change": 0,
    "additional_trained_employees": 0
  }
}
```

The response includes current and simulated metrics, a metric-by-metric comparison (`direction` and `improved`), scenario name, assumptions, summary, and disclaimer. Capacity is employees × weekly hours. Training assumes a 20% reduction in task time for trained employees. Workload ratio is estimated demand hours divided by capacity hours. New hires begin untrained, reassigned tasks reduce pending tasks, and total overtime stays constant. These transparent assumptions are planning estimates, not measured forecasts.

## Frontend integration

Person 6 can send `fetch` or Axios POST requests to the routes above with `Content-Type: application/json`. For local development the frontend must allow requests from the API origin; configure FastAPI CORS with the actual frontend development origin when connecting the UI. Do not put database service-role keys in the browser.

## Smoke test record

Verified locally against the running FastAPI app on 2026-11-21:

- Journey example returned HTTP 200, high attention, score 100, and six reasoned indicators.
- Workload example returned HTTP 200, Engineering moderate with score 72, and one flagged employee (Asha high; Rohan low).
- Simulator example returned HTTP 200: tasks per employee changed from 10 to 8.33, capacity from 400 to 480 hours, demand from 368 to 373.33 hours, and workload ratio from 0.92 to 0.78.
- An impossible simulator request assigning more tasks than pending returned HTTP 422.
