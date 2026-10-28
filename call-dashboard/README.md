# Call Analytics Dashboard

React + TypeScript + Vite dashboard for telecom project.

## Features

- Login and Analyst registration screens.
- JWT bearer authentication with session verification and sign out.
- Role-aware UI: Admin users can inspect paginated raw call logs and filter by caller/receiver number; Analysts see aggregate analytics only.
- KPI cards and backend-powered duration, cost, timeline and city charts.
- Server-side date/city filtering, loading states, API error messages and refresh.

## Run locally

1. Start the backend by following the backend repository README.
2. Copy `.env.example` to `.env` and set `VITE_API_BASE_URL=http://localhost:8000/api/v1`.
3. Install dependencies and start Vite:

   ```bash
   npm install
   npm run dev
   ```

4. Open the local Vite URL. Register an Analyst account or sign in with an Admin account created through the backend CLI.

## Build and lint

```bash
npm run build
npm run lint
```

## Deployment

Deploy this frontend as a Vite static site. Set `VITE_API_BASE_URL` to the public HTTPS API base URL at build time. Configure the backend's `CORS_ORIGINS` to the exact frontend domain. Do not put backend secrets in Vite environment variables; all `VITE_*` variables are public in the browser bundle.
