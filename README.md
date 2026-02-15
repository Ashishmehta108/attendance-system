# Classroom Attention & Feedback Analyzer

Monorepo for real-time and post-class feedback: Express REST API, BullMQ worker (summarization), Next.js frontend.

## Stack

- **API**: Express, Better Auth (login/logout, RBAC), PostgreSQL (Drizzle), Redis (cache + BullMQ), WebSocket (live feedback)
- **Worker**: BullMQ worker for post-class feedback summarization
- **Web**: Next.js 14, TanStack Query, shadcn-style UI, Zod

## Setup

1. **Install**

   ```bash
   pnpm install
   ```

2. **Env**

   Copy `.env.example` and set:

   - `DATABASE_URL` – PostgreSQL connection string
   - `REDIS_URL` – Redis (BullMQ + cache)
   - `BETTER_AUTH_SECRET` – at least 32 characters
   - `API_URL` / `FRONTEND_ORIGIN` – for auth and CORS

   For the Next.js app, set `NEXT_PUBLIC_API_URL` (e.g. in `apps/web/.env.local`).

3. **Database**

   ```bash
   pnpm db:generate   # generate Drizzle migrations
   pnpm db:migrate    # apply migrations
   ```

4. **Run**

   **All at once (API + worker + web):**

   ```bash
   pnpm dev
   ```

   Or run separately:

   - API: `pnpm dev:api` (Express + WebSocket on port 3001)
   - Worker: `pnpm dev:worker` (BullMQ summarization)
   - Web: `pnpm dev:web` (Next.js on port 3000)

## Roles

- **Admin** – full access and user management
- **Instructor** – create classrooms/sessions, view aggregates and summaries (no per-student identity)
- **Student** – submit real-time and post-class feedback, view own sessions

## API (high level)

- `GET/POST /api/classrooms`, `GET/PATCH/DELETE /api/classrooms/:id`
- `GET/POST /api/classrooms/:id/sessions`
- `GET/PATCH /api/sessions/:id`, `GET /api/sessions/:id/aggregate`
- `POST /api/sessions/:id/feedback/realtime`, `POST /api/sessions/:id/feedback/post`
- `GET /api/sessions/:id/summary`
- Auth: `POST /api/auth/*` (Better Auth), `GET /api/me`

WebSocket: connect to API host with `?sessionId=<id>` (cookie auth) for live aggregate updates.
