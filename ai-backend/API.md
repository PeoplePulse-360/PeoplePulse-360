# PeoplePulse 360 AI API

Local base URL: `http://127.0.0.1:8000`. The combined Vercel deployment uses the website's own domain and the same `/api/ai/...` paths.

All request and response bodies use JSON. Interactive schemas are available at `/api/docs` locally and on Vercel. Invalid payloads return HTTP `422` with field validation details.

## Production access

Every AI endpoint on Vercel requires `Authorization: Bearer <Supabase access token>`. The backend verifies the token with Supabase Auth and checks that the user can read their own row in `public.hr_admins` under RLS. Missing or expired credentials return `401`; signed-in non-admin users receive `403`. Local direct `uvicorn` smoke tests remain open by default unless `HR_ADMIN_AUTH_REQUIRED=true` is set. Never use the Supabase service-role key for this check.

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

Analyses employees within departments and returns both employee-level signals and department summaries. Counts and hours must be nonnegative; feedback scores must be from 1 to 5; absent days cannot exceed recorded days. `overtime_hours`, `pending_tasks`, `deadline_extensions`, `workload_complaints`, and `feedback_score` are optional. Omit a value when the shared database has no source for it; missing values are not treated as zero and do not create a risk signal. Attendance counts default to zero.

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

The frontend sends requests to same-origin `/api/ai/<feature>` in the combined Vercel project and attaches the signed-in Supabase access token. For local Vite development, set `VITE_AI_API_URL=http://127.0.0.1:8000`. Local CORS allows `http://localhost:5173` and `http://127.0.0.1:5173`. Do not put database service-role keys in the browser.

## Smoke test record

Verified locally against the running FastAPI app on 2026-11-21:

- Journey example returned HTTP 200, high attention, score 100, and six reasoned indicators.
- Workload example returned HTTP 200, Engineering moderate with score 72, and one flagged employee (Asha high; Rohan low).
- Simulator example returned HTTP 200: tasks per employee changed from 10 to 8.33, capacity from 400 to 480 hours, demand from 368 to 373.33 hours, and workload ratio from 0.92 to 0.78.
- An impossible simulator request assigning more tasks than pending returned HTTP 422.
- Vite CORS preflight is accepted for `http://localhost:5173`; all three API paths appear in OpenAPI.


## Frontend and Supabase data flow

The React application should use the signed-in user's Supabase session and Row Level Security (RLS) to read permitted HR rows, aggregate them into the request shapes above, and POST those JSON bodies to FastAPI. The AI backend currently does not query Supabase directly, so it needs no database service-role key. See [SUPABASE_AI_INTEGRATION.md](SUPABASE_AI_INTEGRATION.md) for source-table mapping and fields the team still needs to confirm.

FastAPI allows Vite origins `http://localhost:5173` and `http://127.0.0.1:5173` by default. Set `FRONTEND_ORIGINS` to comma-separated exact origins for another frontend environment.

## Example responses

### Journey

```json
{
  "results": [
    {
      "employee_id": "EMP002",
      "full_name": "Rohan Mehta",
      "department": "Engineering",
      "attention_level": "low",
      "indicator_score": 0,
      "summary": "No work-record indicators need HR attention right now.",
      "indicators": [],
      "recommendations": [],
      "disclaimer": "These are indicators for HR review, not predictions of behaviour or resignation."
    }
  ],
  "count": 1
}
```

### Workload

```json
{
  "period_days": 30,
  "departments": [
    {
      "department": "Engineering",
      "attention_level": "low",
      "indicator_score": 0,
      "employee_count": 1,
      "flagged_employee_count": 0,
      "summary": "Engineering shows no workload imbalance in this period.",
      "indicators": [],
      "recommendations": [],
      "employees": [
        {
          "employee_id": "EMP002",
          "full_name": "Rohan Mehta",
          "attention_level": "low",
          "indicator_score": 0,
          "indicators": [],
          "recommendations": []
        }
      ]
    }
  ],
  "disclaimer": "These are workload indicators for HR review, not proof of the cause."
}
```

### Simulator (representative comparison entries)

```json
{
  "scenario_name": "Hire 2 employees",
  "assumptions": [
    "Pending tasks stay the same when people are hired.",
    "New hires are counted as untrained.",
    "A trained employee is estimated to take 20% less time per task.",
    "The team overtime total stays as entered."
  ],
  "current": {
    "employee_count": 10,
    "pending_tasks": 100,
    "weekly_hours_per_employee": 40,
    "trained_employee_count": 4,
    "tasks_per_employee": 10,
    "capacity_hours": 400,
    "demand_hours": 368,
    "workload_ratio": 0.92,
    "overtime_per_employee": 2,
    "trained_percentage": 40
  },
  "simulated": {
    "employee_count": 12,
    "pending_tasks": 100,
    "weekly_hours_per_employee": 40,
    "trained_employee_count": 4,
    "tasks_per_employee": 8.33,
    "capacity_hours": 480,
    "demand_hours": 373.33,
    "workload_ratio": 0.78,
    "overtime_per_employee": 1.67,
    "trained_percentage": 33.33
  },
  "comparison": [
    {
      "metric": "tasks_per_employee",
      "label": "Tasks per employee",
      "current": 10,
      "simulated": 8.33,
      "change": -1.67,
      "direction": "down",
      "improved": true
    },
    {
      "metric": "workload_ratio",
      "label": "Workload ratio",
      "current": 0.92,
      "simulated": 0.78,
      "change": -0.14,
      "direction": "down",
      "improved": true
    }
  ],
  "summary": "Average load falls from 10 to 8.33 tasks per employee under this scenario.",
  "disclaimer": "These figures are simple planning estimates for an HR discussion."
}
```

The simulator returns comparison entries for all metrics; two representative entries are shown above.
