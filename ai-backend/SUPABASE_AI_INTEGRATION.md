# Supabase data flow for AI endpoints

## Recommended request flow

The React application uses the existing Supabase JavaScript client and the signed-in user's session to read HR records allowed by Supabase Row Level Security (RLS). It aggregates/maps those rows into the JSON request contracts in `API.md`, then sends the request to FastAPI. FastAPI analyses the supplied data and returns the result.

This keeps the Supabase service-role key out of the browser and means the AI backend does not need database credentials. The backend currently does not query Supabase directly.

```text
React + Supabase Auth
        |
        | Supabase client reads rows allowed by RLS
        v
Normalize rows to API.md request shape
        |
        | POST JSON
        v
FastAPI AI endpoint -> analysis -> JSON response
```

## Data mapping to confirm with table owners

Use the shared employee identifier and verify actual column names with the responsible module owner before writing the Supabase queries.

| AI request section | Expected source | Mapping needed |
|---|---|---|
| Employee identity | `employees` | employee ID, full name, department |
| Journey attendance | `attendance` | period days, present, absent, late, and half-day counts |
| Journey leave | `leaves` | pending request count and approved leave days in the last 90 days |
| Journey onboarding | `onboarding_tasks` | total and completed task counts |
| Journey performance | `performance_reviews` | ratings ordered from oldest to newest |
| Journey goals | `employee_goals` | total, completed, and average progress |
| Journey feedback | `feedback_responses` | response count and average score on the agreed 1–5 scale |
| Journey grievances | `grievances` | count of records in open statuses |
| Workload absence | `attendance` | absence rate in the requested period |
| Workload feedback | `feedback_responses` | average workload-related score, if the survey question can be identified |
| Workload overtime, pending tasks, extensions, complaints | Team-confirmed source | These fields are not defined in the initial table allocation. Agree where they will be stored before claiming this analysis uses live data. |
| Simulator baseline | HR analytics or HR-entered scenario values | employee count, task count, hours, overtime, task-time estimate, trained employee count |

## Request-building notes

- Filter employee records using the signed-in user's allowed organization scope and RLS policies.
- Aggregate data into one AI request rather than sending every raw database row.
- Do not send unnecessary personal or sensitive attributes.
- For performance ratings, preserve chronological order so the journey analysis can detect a change between reviews.
- Omit unavailable optional journey sections instead of filling them with fabricated risk signals.
- Keep API request field names stable; discuss any contract change with Person 5 and Person 6 first.

## Local browser access

FastAPI CORS allows Vite at `localhost:5173` and `127.0.0.1:5173` by default. Set `FRONTEND_ORIGINS` to a comma-separated list of exact frontend origins for other development or deployed URLs.

Do not set the origin to `*` while credentials are enabled.
