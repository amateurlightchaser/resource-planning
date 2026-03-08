# Resource Planning App

A simplified Float-style team resource planning app focused on scheduling and resource allocation (no finance/budget features).

## Features

- **Schedule** page with interactive week/day/month calendar (drag, drop, resize, duplicate, delete assignments).
- **Project Plan** view with per-project timeline list and assignment summaries.
- **People** directory with capacity and utilization indicators.
- **Projects** directory with status, member count, and total assigned hours.
- CRUD APIs for People, Projects, Assignments, and Time Off.
- Prisma + PostgreSQL persistence with seed demo data.

## Tech stack

- Next.js 14 + React + TypeScript
- Tailwind CSS
- FullCalendar
- Prisma ORM + PostgreSQL
- Zod validation
- Vitest for basic validation tests

## Quick start

1. Install dependencies:
   ```bash
   pnpm install
   ```
2. Copy env and start Postgres:
   ```bash
   cp .env.example .env
   docker compose up -d
   ```
3. Generate Prisma client and migrate:
   ```bash
   pnpm prisma:generate
   pnpm prisma:migrate --name init
   ```
4. Seed demo data:
   ```bash
   pnpm prisma:seed
   ```
5. Start app:
   ```bash
   pnpm dev
   ```

Open http://localhost:3000.

## Demo login

- Email: `admin@example.com`
- Password: `password123`

## API endpoints

### People
- `GET /api/people`
- `POST /api/people`
- `PATCH /api/people/:id`

### Projects
- `GET /api/projects`
- `POST /api/projects`
- `PATCH /api/projects/:id`

### Assignments
- `GET /api/assignments?from=...&to=...&peopleIds=...&projectIds=...`
- `POST /api/assignments`
- `PATCH /api/assignments/:id`
- `DELETE /api/assignments/:id`

### Time Off
- `GET /api/timeoff?from=...&to=...&peopleIds=...`
- `POST /api/timeoff`
- `PATCH /api/timeoff/:id`
- `DELETE /api/timeoff/:id`

## Notes

- Time is stored in UTC in database.
- UI defaults to weekly scheduling workflows.
- Over-allocation is highlighted in People view and is allowed.
