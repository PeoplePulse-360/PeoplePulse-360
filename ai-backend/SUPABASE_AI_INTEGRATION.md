# Supabase data flow for AI endpoints

## Recommended flow

React uses the signed-in user's Supabase session to read rows allowed by Row Level Security (RLS), aggregates them into the request formats in `API.md`, and posts JSON to FastAPI. The AI backend does not query Supabase directly and needs no database key.

## Current schema check (2026-11-22)

The shared project currently has the Person 1 tables (`employees`, `jobs`, `candidates`, `applications`, `interviews`), Person 2 tables (`attendance`, `leaves`, `leave_balances`, `onboarding_tasks`), and Person 4 tables (`exit_records`, `exit_interviews`).

The employee table uses `id` (UUID primary key) and `emp_id` (unique employee code), plus `full_name` and `department`. Child tables reference the UUID `employees.id`; when building the AI request, join by UUID but send `employees.emp_id` as `employee_id`, because the API expects codes such as `EMP001`.

| AI request data | Current table columns and mapping |
|---|---|
| Employee identity | `employees.emp_id` -> `employee_id`; `full_name`; `department` |
| Journey attendance | `attendance.employee_id`, `attendance_date`, `status`; count statuses `Present`, `Absent`, `Late`, and `Half Day` for the selected period |
| Journey leave | `leaves.employee_id`, `start_date`, `end_date`, `status`; count `Pending` requests and calculate approved calendar days overlapping the last 90 days |
| Journey onboarding | `onboarding_tasks.employee_id`, `status`; count all tasks and those with `status = 'Completed'` |
| Simulator baseline | Aggregate dashboard data or values entered by HR; no simulator-specific table is needed |

The current `attendance`, `leaves`, `leave_balances`, and `onboarding_tasks` tables have no records yet. The endpoint formats can accept these aggregates once records are added.

## Sources not in Supabase yet

The Person 3 tables `performance_reviews`, `employee_goals`, `feedback_surveys`, `feedback_responses`, and `grievances` are not present, so those Journey inputs cannot yet use live data.

The current schema has no defined source for workload overtime hours, pending tasks, deadline extensions, workload complaints, or workload-related feedback. Do not label those as live-data analysis until the team agrees where those values will be stored.

## Access policy note

RLS is enabled on the current HR tables. The policies currently allow public reads of all employee rows and allow authenticated users to read and modify all exit records/interviews (`USING`/`WITH CHECK` are `true`). Have the database owners review these policies and apply the intended HR access scope before using real employee data. No database policies were changed during this inspection.

## Request-building notes

- Filter rows to the signed-in user's authorized organization scope.
- Aggregate records rather than sending every raw row to the AI API.
- Do not send unnecessary personal attributes.
- Order performance ratings oldest to newest once the reviews table exists.
- Omit unavailable optional Journey sections; missing data is not a warning signal.
- Keep JSON field names stable and coordinate contract changes with Persons 5 and 6.

## Local browser access

FastAPI CORS allows Vite at `http://localhost:5173` and `http://127.0.0.1:5173` by default. Set `FRONTEND_ORIGINS` to a comma-separated list of exact frontend origins for other environments. Do not use `*` while credentials are enabled.
