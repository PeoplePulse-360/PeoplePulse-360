# PEOPLEPULSE 360

Integrated HR workspace built with React, Vite, Supabase, and FastAPI.

## Local development

1. Copy `.env.example` to `.env` and set the Supabase project URL and public anon/publishable key.
2. Install frontend dependencies with `npm install`.
3. Start the frontend with `npm run dev`.
4. In a second terminal, install `ai-backend/requirements.txt` in a Python virtual environment and run `uvicorn main:app --reload` from `ai-backend`.

Normal HR records use the signed-in Supabase client and Row Level Security. The FastAPI service exposes the journey, workload, and simulator APIs at `/api/ai/*`. In production, requests require a Supabase access token and an HR-admin entry in `hr_admins`. Never put a Supabase service-role key in frontend code or environment variables exposed to Vite.

## Vercel

The Vercel project uses Services mode to build the frontend and `ai-backend` together on the same domain. `/api/*` routes to FastAPI and all other routes serve the React application. Set the project framework to **Services** and keep the Vercel project environment variables for the public Supabase URL and publishable key available to both services. The FastAPI auth check uses these public values to verify the user's token and HR-admin membership; it does not use a service-role key.

AI request and response formats are documented in [ai-backend/API.md](ai-backend/API.md). Supabase table mapping and unavailable workload data sources are documented in [ai-backend/SUPABASE_AI_INTEGRATION.md](ai-backend/SUPABASE_AI_INTEGRATION.md).

## Integrated modules

Employee and recruitment, attendance, leave, onboarding, performance, feedback and surveys, grievances, exits, and HR analytics are wired into the main navigation. The three AI analyses and What-If Simulator use the shared FastAPI service.
