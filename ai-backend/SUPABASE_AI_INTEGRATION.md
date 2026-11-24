# Supabase data flow for AI endpoints

## Request flow

The signed-in React app reads records allowed by Supabase Row Level Security (RLS), aggregates them into the JSON shapes in `API.md`, and sends them to FastAPI. The AI backend does not need a database service-role key.

On the combined Vercel deployment, the browser calls the same-origin `/api/ai/...` path and includes its Supabase access token. FastAPI verifies that token with Supabase Auth and checks that the user can read their own `hr_admins.user_id` row. The live `hr_admins` policy is `authenticated SELECT` with `user_id = auth.uid()`.

## Shared schema check (2026-11-24)

The current shared database has these tables and columns relevant to AI requests:

| AI input | Supabase source and mapping |
|---|---|
| Employee identity | `employees.id` is the UUID foreign-key target; send `employees.emp_id` as the API `employee_id`, plus `full_name` and `department`. |
| Journey attendance | `attendance.employee_id`, `attendance_date`, `status`; count `Present`, `Absent`, `Late`, and `Half Day` for the last 30 days. |
| Journey leave | `leaves.employee_id`, `start_date`, `end_date`, `status`; count pending requests and approved calendar days overlapping the last 90 days. |
| Journey onboarding | `onboarding_tasks.employee_id`, `status`; count all tasks and those with `status = 'Completed'`. |
| Journey performance | `performance_reviews.employee_id`, `rating`, `created_at`; omit null ratings and preserve oldest-to-newest order. |
| Journey goals | `employee_goals.employee_id`, `progress`, `status`; send goal totals, completed count, and mean progress. |
| Journey feedback | Prefer rated `feedback_responses.avg_rating` grouped by `employee_id`; if no rated responses exist for that employee, use `feedback.rating`. Do not infer ratings from comments. |
| Journey grievances | `grievances.employee_id`, `status`; count active states (`open`, `submitted`, `under review`, `in_review`, `in progress`, `in_progress`). |
| Workload attendance | Use the same 30-day attendance mapping to calculate recorded and absent days. |
| Other workload inputs | No shared source is currently defined for overtime, general pending work tasks, deadline extensions, workload complaints, or workload-specific feedback. Omit these optional API fields; do not substitute zero or onboarding tasks. |
| Simulator baseline | Use live headcount where useful; task/hour/training inputs remain HR-entered scenario assumptions because no shared source is defined for them. |

The schema inspection found employee, attendance, performance, goal, feedback, feedback-response, survey, grievance, and exit tables. Some tables currently have no rows, so the frontend omits those employee sections from the Journey request. An empty table is not a warning signal.

## Data handling

- Filter records through the signed-in user's RLS access.
- Send aggregates, not raw record histories, and omit unnecessary personal fields.
- Do not represent unavailable data as a zero or as an AI finding.
- Keep the JSON contract stable; coordinate changes with Persons 5 and 6.
- Journey and workload results are indicators for HR review, not claims about employee behavior or resignation.

## Local development and production

- Local FastAPI defaults to `http://127.0.0.1:8000`; Vite may use `VITE_AI_API_URL=http://127.0.0.1:8000`.
- The combined Vercel deployment routes `/api/*` to FastAPI and other requests to the Vite frontend. Production frontend calls use the same origin.
- Vercel must provide the existing public Supabase URL/key as server environment values for the backend's token/admin check. Do not add a service-role key.
- Set `HR_ADMIN_AUTH_REQUIRED=true` for deployment environments; the backend also enables it when it detects Vercel's runtime environment.
- Local Vite origins `http://localhost:5173` and `http://127.0.0.1:5173` are allowed by default. For a different local origin, set `FRONTEND_ORIGINS` to the exact origins; do not use `*` with credentials.
