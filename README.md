# PEOPLEPULSE 360

Main React frontend for the HR management and workforce intelligence system.

## Run the frontend

1. Copy `.env.example` to `.env` and add the Supabase project URL and public anon/publishable key.
2. Install dependencies with `npm install`.
3. Start the site with `npm run dev`.

The browser uses Supabase Auth and the public Supabase client for ordinary HR data. Never add a service-role key to frontend code.

## AI services

The Journey, Workload, and Simulator pages send JSON requests to the FastAPI URL set by `VITE_AI_API_URL` (default `http://127.0.0.1:8000`). The API implementation and request documentation are maintained on the `person-5-ai-backend` branch. Start that backend separately for AI features.

## Module integration

Employee/recruitment and exit/analytics pages are integrated. Navigation routes for attendance, leave, onboarding, performance, feedback, and grievances are ready for those team modules.
