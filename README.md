# Telecom Platform

This bundle contains the existing Week 2 React dashboard updated to use the Week 3 FastAPI/PostgreSQL backend.

## Project layout

- `call-dashboard/` — React, TypeScript, Vite, Tailwind and Recharts frontend.
- `telecom-backend/` — FastAPI API, SQLAlchemy models, PostgreSQL configuration, JWT authentication, role permissions, analytics and the supplied CDR spreadsheet.

## Quick start

### 1. Start the backend

Open a terminal in `telecom-backend/`:

1. Copy `.env.example` to `.env`.
2. Set a strong local database password and a random `JWT_SECRET` of at least 32 characters. Keep these values private.
3. Start PostgreSQL: `docker compose up -d db`.
4. Create a virtual environment and install dependencies: `python -m venv .venv`, activate it, then `pip install -r requirements.txt`.
5. Load sample records: `python -m scripts.seed_calls`.
6. Create an admin account: `python -m scripts.create_user --email admin@example.com --name "Platform Admin" --role admin` (you will be prompted for a password).
7. Start the API: `uvicorn app.main:app --reload`.

API docs: <http://localhost:8000/docs>. Health check: <http://localhost:8000/health>.

### 2. Start the frontend

Open another terminal in `call-dashboard/`:

1. Copy `.env.example` to `.env`.
2. Ensure `VITE_API_BASE_URL=http://localhost:8000/api/v1`.
3. Install dependencies: `npm install`.
4. Start the frontend: `npm run dev`.
5. Open the Vite URL shown in the terminal. Sign in using the admin credentials or register an Analyst account.

## Role behaviour

- **Admin:** analytics, filtered raw call logs, pagination and caller/receiver-number filters.
- **Analyst:** aggregate analytics only; no raw call logs or phone-number-specific analytics.
- Public registration creates Analyst accounts only. Admin accounts must be created using the backend CLI.

## Validation performed in this environment

- TypeScript project check: passed (`tsc -b`).
- ESLint: passed.
- Python syntax compilation: passed.
- A full Vite production bundle and live database/API integration test could not be completed in this environment because the uploaded `node_modules` tree contains platform-specific native dependencies from another OS and the backend Python dependencies/database are not installed here. Run `npm install && npm run build` locally and follow the setup above for runtime verification.


