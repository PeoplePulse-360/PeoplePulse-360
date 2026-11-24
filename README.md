# PEOPLEPULSE 360

AI-powered HR management and workforce intelligence system.

## Run the frontend

1. Copy `.env.example` to `.env` and add the Supabase project URL and public anon/publishable key.
2. Install packages with `npm install`.
3. Start the site with `npm run dev` and open the local URL Vite prints.

The frontend uses Supabase Auth and the browser client for regular HR data. Do not put a Supabase service-role key in `.env` or frontend code.

## Run the AI API

From `ai-backend`, install `requirements.txt`, then run:

```powershell
python -m uvicorn main:app --reload
```

The default frontend AI URL is `http://127.0.0.1:8000`. Set `VITE_AI_API_URL` in `.env` if it differs. API request and response examples are documented in [ai-backend/API.md](ai-backend/API.md).

## Frontend integration status

- Employee and recruitment pages use Person 1's module.
- Exit management and HR analytics use Person 4's module.
- Login, registration, shared layout, navigation, dashboard and the simulator are in the common React app.
- Journey and workload insight pages call Person 5's FastAPI routes using synthetic sample payloads until the missing HR module data is integrated.
- Attendance, leave, onboarding, performance, feedback and grievances have navigation routes waiting for their module pages.
