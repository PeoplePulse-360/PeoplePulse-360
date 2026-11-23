# PeoplePulse 360 AI Backend

## Run locally

From this folder, install the packages in `requirements.txt`, then start the API with:

```powershell
python -m uvicorn main:app --reload
```

Swagger UI is available at `http://127.0.0.1:8000/docs`.

## Endpoints

The API currently provides:

- `POST /api/ai/journey` — Employee Journey Prediction.
- `POST /api/ai/workload` — Workload Friction Detection.
- `POST /api/ai/simulator` — HR What-If Simulator.

See [API.md](API.md) for request formats, output descriptions, and assumptions. Synthetic example files are in the repository's `datasets` folder.

## What-If Simulator

`POST /api/ai/simulator` compares the current workforce situation with a scenario.

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

The `changes` object is optional. Any omitted change is treated as zero. The endpoint returns `scenario_name`, `assumptions`, current and simulated metrics, a per-metric comparison, a summary, and a planning estimate disclaimer.

The calculation uses these rules:

- Capacity hours = employee count × weekly hours per employee.
- Trained share = trained employee count ÷ employee count.
- Effective task hours = average task hours × (1 − 0.20 × trained share).
- Demand hours = pending tasks × effective task hours.
- Workload ratio = demand hours ÷ capacity hours.
- Tasks per employee = pending tasks ÷ employee count.
- Overtime per employee = team overtime hours ÷ employee count.

Training efficiency is a configurable estimate, not a measured result. The simulator is for planning discussion.



## Same-project Vercel deployment

The integration branch contains both the Vite application and this `ai-backend` folder. Vercel Services routes `/api/*` to FastAPI and other paths to Vite. Production AI endpoints require a valid Supabase access token and an `hr_admins` row; the backend uses the public Supabase key with the caller's token and does not need the service-role key. See [API.md](API.md) and [SUPABASE_AI_INTEGRATION.md](SUPABASE_AI_INTEGRATION.md).
