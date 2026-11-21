-- =====================================================================
-- PeoplePulse 360: Employee and Recruitment database (Person 1)
-- Tables: employees, jobs, candidates, applications, interviews
-- Employee ID format agreed by the team: EMP-001, EMP-002, ...
-- Run this file once in the Supabase SQL Editor.
-- =====================================================================

-- ---------- TABLES ----------

create table employees (
  id uuid primary key default gen_random_uuid(),
  emp_id text not null unique,            -- format: EMP-001
  full_name text not null,
  email text not null unique,
  phone text not null,
  department text not null,
  designation text not null,
  joining_date date not null,
  status text not null default 'Active'
    check (status in ('Active', 'On Leave', 'Resigned')),
  salary numeric,                         -- optional, yearly salary in rupees
  created_at timestamptz not null default now()
);

create table jobs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  department text not null,
  location text not null,
  job_type text not null default 'Full-time'
    check (job_type in ('Full-time', 'Part-time', 'Internship', 'Contract')),
  openings integer not null default 1 check (openings >= 1),
  description text,
  status text not null default 'Open' check (status in ('Open', 'Closed')),
  posted_date date not null default current_date,
  created_at timestamptz not null default now()
);

create table candidates (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null unique,
  phone text not null,
  experience_years numeric,               -- empty means fresher
  skills text,
  created_at timestamptz not null default now()
);

create table applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id) on delete cascade,
  candidate_id uuid not null references candidates(id) on delete cascade,
  status text not null default 'Applied'
    check (status in ('Applied', 'Shortlisted', 'Interview Scheduled', 'Selected', 'Rejected')),
  applied_date date not null default current_date,
  created_at timestamptz not null default now(),
  unique (job_id, candidate_id)           -- one application per candidate per job
);

create table interviews (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references applications(id) on delete cascade,
  interview_date date not null,
  interview_time time not null,
  mode text not null default 'Online' check (mode in ('Online', 'In person', 'Phone')),
  interviewer text not null,
  result text not null default 'Pending' check (result in ('Pending', 'Passed', 'Failed')),
  feedback text,
  created_at timestamptz not null default now()
);

-- ---------- SAMPLE DATA ----------

insert into employees (emp_id, full_name, email, phone, department, designation, joining_date, status, salary) values
('EMP-001', 'Aarav Sharma',   'aarav.sharma@peoplepulse.com',   '9876543210', 'Engineering',     'Senior Developer',   '2022-03-14', 'Active',   1200000),
('EMP-002', 'Priya Mehta',    'priya.mehta@peoplepulse.com',    '9811122233', 'Human Resources', 'HR Manager',         '2021-07-01', 'Active',   950000),
('EMP-003', 'Rohan Verma',    'rohan.verma@peoplepulse.com',    '9822334455', 'Marketing',       'Content Strategist', '2023-01-09', 'On Leave', 700000),
('EMP-004', 'Sneha Kapoor',   'sneha.kapoor@peoplepulse.com',   '9833445566', 'Sales',           'Account Executive',  '2020-11-23', 'Active',   800000),
('EMP-005', 'Karan Malhotra', 'karan.malhotra@peoplepulse.com', '9844556677', 'Finance',         'Financial Analyst',  '2019-05-17', 'Resigned', 850000),
('EMP-006', 'Ananya Iyer',    'ananya.iyer@peoplepulse.com',    '9855667788', 'Engineering',     'UI Designer',        '2024-02-05', 'Active',   null),
('EMP-007', 'Vikram Singh',   'vikram.singh@peoplepulse.com',   '9866778899', 'Operations',      'Operations Lead',    '2021-09-30', 'Active',   900000);

insert into jobs (title, department, location, job_type, openings, description, status, posted_date) values
('Frontend Developer', 'Engineering',     'Jaipur', 'Full-time', 2, 'Build clean React screens for our HR tools.',      'Open',   '2026-10-20'),
('HR Executive',       'Human Resources', 'Remote', 'Full-time', 1, 'Support hiring, onboarding and employee queries.', 'Open',   '2026-10-28'),
('Marketing Intern',   'Marketing',       'Delhi',  'Internship', 3, 'Help the team with social media and campaigns.',   'Open',   '2026-11-02'),
('Accountant',         'Finance',         'Jaipur', 'Full-time', 1, 'Manage payroll entries and monthly reports.',       'Closed', '2026-09-10');

insert into candidates (full_name, email, phone, experience_years, skills) values
('Meera Joshi', 'meera.joshi@gmail.com', '9900112233', 2, 'React, JavaScript, Tailwind'),
('Arjun Rao',   'arjun.rao@gmail.com',   '9900223344', 4, 'React, Node.js, SQL'),
('Isha Gupta',  'isha.gupta@gmail.com',  '9900334455', 1, 'Recruiting, Communication'),
('Dev Patel',   'dev.patel@gmail.com',   '9900445566', 0, 'Social media, Canva'),
('Nisha Reddy', 'nisha.reddy@gmail.com', '9900556677', 3, 'Tally, Excel, GST');

insert into applications (job_id, candidate_id, status, applied_date) values
((select id from jobs where title = 'Frontend Developer'), (select id from candidates where email = 'meera.joshi@gmail.com'), 'Interview Scheduled', '2026-10-25'),
((select id from jobs where title = 'Frontend Developer'), (select id from candidates where email = 'arjun.rao@gmail.com'),   'Shortlisted',         '2026-10-27'),
((select id from jobs where title = 'HR Executive'),       (select id from candidates where email = 'isha.gupta@gmail.com'),  'Applied',             '2026-11-01'),
((select id from jobs where title = 'Marketing Intern'),   (select id from candidates where email = 'dev.patel@gmail.com'),   'Applied',             '2026-11-05'),
((select id from jobs where title = 'Accountant'),         (select id from candidates where email = 'nisha.reddy@gmail.com'), 'Selected',            '2026-09-15'),
((select id from jobs where title = 'HR Executive'),       (select id from candidates where email = 'meera.joshi@gmail.com'), 'Rejected',            '2026-11-03');

insert into interviews (application_id, interview_date, interview_time, mode, interviewer, result, feedback)
select a.id, '2026-11-25', '11:00', 'Online', 'Priya Mehta', 'Pending', null
from applications a
join jobs j on j.id = a.job_id
join candidates c on c.id = a.candidate_id
where j.title = 'Frontend Developer' and c.email = 'meera.joshi@gmail.com';

insert into interviews (application_id, interview_date, interview_time, mode, interviewer, result, feedback)
select a.id, '2026-09-22', '15:30', 'In person', 'Karan Malhotra', 'Passed', 'Strong with payroll and GST work.'
from applications a
join jobs j on j.id = a.job_id
join candidates c on c.id = a.candidate_id
where j.title = 'Accountant' and c.email = 'nisha.reddy@gmail.com';
