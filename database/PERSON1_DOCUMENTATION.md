# Person 1: Employee and Recruitment Management

This document describes the database tables and the frontend files owned by Person 1.
The SQL to create everything is in `database/person1_employee_recruitment.sql`.

## Employee ID format

`EMP-001`, `EMP-002`, `EMP-003` and so on (prefix `EMP-` plus 3 or more digits).
The Employee page picks the next free ID automatically.

## Tables

### 1. employees (owned by Person 1, nobody else should create another one)

| Column | Type | Rules |
|---|---|---|
| id | uuid | Primary key, created automatically. **Other tables should link to this column.** |
| emp_id | text | Required, unique. Format `EMP-001`. |
| full_name | text | Required |
| email | text | Required, unique |
| phone | text | Required (10 digits, checked by the page) |
| department | text | Required |
| designation | text | Required |
| joining_date | date | Required |
| status | text | Required. One of: Active, On Leave, Resigned. Default Active. |
| salary | numeric | Optional. Yearly salary in rupees. |
| created_at | timestamptz | Created automatically |

### 2. jobs

| Column | Type | Rules |
|---|---|---|
| id | uuid | Primary key |
| title | text | Required |
| department | text | Required |
| location | text | Required |
| job_type | text | Full-time, Part-time, Internship or Contract. Default Full-time. |
| openings | integer | 1 or more. Default 1. |
| description | text | Optional |
| status | text | Open or Closed. Default Open. |
| posted_date | date | Default today |
| created_at | timestamptz | Created automatically |

### 3. candidates

| Column | Type | Rules |
|---|---|---|
| id | uuid | Primary key |
| full_name | text | Required |
| email | text | Required, unique |
| phone | text | Required |
| experience_years | numeric | Optional. Empty or 0 means fresher. |
| skills | text | Optional, comma separated |
| created_at | timestamptz | Created automatically |

### 4. applications

| Column | Type | Rules |
|---|---|---|
| id | uuid | Primary key |
| job_id | uuid | Required. Foreign key to jobs(id). |
| candidate_id | uuid | Required. Foreign key to candidates(id). |
| status | text | Applied, Shortlisted, Interview Scheduled, Selected or Rejected. Default Applied. |
| applied_date | date | Default today |
| created_at | timestamptz | Created automatically |

A candidate can apply to a job only once (unique on job_id and candidate_id).

### 5. interviews

| Column | Type | Rules |
|---|---|---|
| id | uuid | Primary key |
| application_id | uuid | Required. Foreign key to applications(id). |
| interview_date | date | Required |
| interview_time | time | Required |
| mode | text | Online, In person or Phone. Default Online. |
| interviewer | text | Required |
| result | text | Pending, Passed or Failed. Default Pending. |
| feedback | text | Optional |
| created_at | timestamptz | Created automatically |

## Relationships

- One job has many applications.
- One candidate has many applications.
- One application has many interviews.
- Deleting a job, a candidate or an application also deletes the rows that depend on it (`on delete cascade`).

## How other modules should use employees

Link to an employee with a foreign key on the `id` column (uuid), not on `emp_id`:

```sql
employee_id uuid not null references employees(id)
```

Use `emp_id` (for example EMP-001) only to show the ID to people on screen.

## Frontend files

| File | Purpose |
|---|---|
| `src/pages/EmployeeManagement.jsx` | Employee page: add, view, edit, delete, search, filters, statistics |
| `src/pages/RecruitmentManagement.jsx` | Recruitment page: jobs, candidates, applications, interviews, statistics |
| `src/utils/supabaseClient.js` | Shared Supabase connection used by both pages |

Routes: `/employees` and `/recruitment`. Both have links in the sidebar (`src/components/AppShell.jsx`).
The package `@supabase/supabase-js` was added to `package.json`. Run `npm install` once after pulling.

## Notes

- Row Level Security (RLS) is currently off on these tables because the project has no login yet. It should be turned on when authentication is added.
- The Supabase Project URL and Publishable Key are public by design. The database password must never be committed to GitHub.
