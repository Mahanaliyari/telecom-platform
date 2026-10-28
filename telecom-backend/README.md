# Telecom Intelligence Platform API

FastAPI and PostgreSQL backend for the Week 3 London Success Academy telecom CDR assignment.

## Features

- JWT login and `/auth/me` session verification.
- Public registration; new accounts are always assigned the `analyst` role.
- bcrypt password hashing and role checks on every protected request.
- Admin-only paginated/filterable raw call records and user listing.
- Admin and Analyst access to aggregate analytics (summary, call types, top callers, city stats, timeline, duration distribution).
- Consistent JSON error responses, request validation and health check.
- PostgreSQL storage for the supplied 10,000-row CDR spreadsheet.

## Requirements

- Python 3.11+ (Python 3.12 recommended)
- Docker Desktop / Docker Engine with Compose
- Node.js 20.19+ or 22.12+ for the frontend (Vite 8 requirement)

## Local setup

1. Copy `.env.example` to `.env` and replace the database password and `JWT_SECRET` with your own values. Use the same database credentials in `DATABASE_URL` and the `POSTGRES_*` variables.
2. Start PostgreSQL from this directory:

   ```bash
   docker compose up -d db
   ```

3. Create and activate a Python virtual environment, then install dependencies:

   ```bash
   python -m venv .venv
   # Windows PowerShell: .venv\Scripts\Activate.ps1
   # macOS/Linux: source .venv/bin/activate
   pip install -r requirements.txt
   ```

4. Seed the sample records (this also creates the tables):

   ```bash
   python -m scripts.seed_calls
   ```

   Re-run with `python -m scripts.seed_calls --reset` only if you intend to replace all call records.

5. Create an administrator account. The command prompts for the password rather than putting it in shell history:

   ```bash
   python -m scripts.create_user --email admin@example.com --name "Platform Admin" --role admin
   ```

6. Start the API:

   ```bash
   uvicorn app.main:app --reload
   ```

   - API root: <http://localhost:8000/>
   - Interactive OpenAPI docs: <http://localhost:8000/docs>
   - Health check: <http://localhost:8000/health>

## Main endpoints

| Method | Endpoint | Access |
| --- | --- | --- |
| POST | `/api/v1/auth/register` | Public; creates Analyst account |
| POST | `/api/v1/auth/login` | Public; returns bearer token and user |
| GET | `/api/v1/auth/me` | Authenticated |
| GET | `/api/v1/calls?page=1&pageSize=15` | Admin |
| GET | `/api/v1/calls/{id}` | Admin |
| GET | `/api/v1/analytics/summary` | Admin, Analyst |
| GET | `/api/v1/analytics/call-types` | Admin, Analyst |
| GET | `/api/v1/analytics/top-callers` | Admin, Analyst |
| GET | `/api/v1/analytics/cities` | Admin, Analyst |
| GET | `/api/v1/analytics/calls-over-time?granularity=hourOfDay` | Admin, Analyst |
| GET | `/api/v1/analytics/duration-distribution` | Admin, Analyst |
| GET | `/api/v1/users` | Admin |

Call and analytics endpoints accept `dateFrom`, `dateTo`, and `city`. Admins can additionally filter by `callerNumber` and `receiverNumber`. Date filtering uses UTC. `pageSize` is capped at 100.

## Roles

- **Admin:** can view raw call records, filter by phone number, view aggregate analytics and list accounts.
- **Analyst:** can view aggregate analytics only; raw call records and phone-number-filtered analytics are restricted.
- Registration never accepts a role from the client. Create or promote admins only through the trusted CLI.

## Frontend configuration

Set `VITE_API_BASE_URL` in the frontend `.env` file to `http://localhost:8000/api/v1` for local development. For deployment, set it to the deployed HTTPS API base URL and set `CORS_ORIGINS` to the exact deployed frontend origin(s).

## Security notes

- Never commit `.env`, database passwords or JWT secrets.
- The frontend stores the bearer token in `sessionStorage`, which is cleared when the browser tab session ends. For production use with sensitive data, prefer an HttpOnly, Secure, SameSite cookie architecture and an appropriate CSRF strategy.
- Use HTTPS in production, rotate any secret that has been exposed, and use managed database credentials in deployment.
