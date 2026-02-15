Classroom Attention & Feedback Analyzer – Implementation Plan

Architecture Overview





Monorepo with shared packages; Express runs the REST API and optional WebSocket server; Next.js is the frontend and calls the API.



Post-class summarization runs as a separate worker process (microservice) that consumes BullMQ jobs and writes summaries to the DB.



Real-time feedback during class is delivered over WebSockets; optionally backed by Redis for multi-instance scaling.

flowchart TB
  subgraph frontend [Next.js Frontend]
    Web[Next.js App]
    AuthClient[Better Auth Client]
    Web --> AuthClient
  end

  subgraph api [Express API]
    REST[REST Routes]
    WS[WebSocket Server]
    AuthHandler[Better Auth toNodeHandler]
    REST --> AuthHandler
  end

  subgraph worker [Summarization Worker]
    BullWorker[BullMQ Worker]
    Summarize[Summarize Job]
    BullWorker --> Summarize
  end

  subgraph data [Data Layer]
    PG[(PostgreSQL)]
    Redis[(Redis)]
  end

  Web -->|REST + cookies| REST
  Web -->|WS| WS
  REST --> PG
  REST --> Redis
  BullWorker --> Redis
  Summarize --> PG
  WS --> Redis



1. Repo and workspace structure

Use a pnpm (or npm) workspace at the repo root:





apps/api – Express app: REST API, Better Auth mount, optional WebSocket server.



apps/web – Next.js app: TanStack Query, shadcn, Zod, calls apps/api (env NEXT_PUBLIC_API_URL).



apps/worker – Node process that runs the BullMQ worker for post-class summarization (microservice).



packages/db – Drizzle config, schema (auth + app tables), and shared DB client.



packages/shared – Shared TypeScript types, Zod schemas, constants (e.g. feedback levels, roles).

Root package.json: "private": true, "workspaces": ["apps/*", "packages/*"]. Use ESM ("type": "module") for Better Auth compatibility.



2. Database (PostgreSQL + Drizzle)





Single PostgreSQL database used by both API and worker.



Drizzle as the only ORM; all tables defined in packages/db.

Auth tables (Better Auth + Admin plugin)
Use Better Auth CLI to generate Drizzle schema into packages/db (e.g. core.ts or auth.ts), then add app tables in the same package.

App tables (high level)  





classrooms – id, name, description, createdBy (user id), createdAt, etc.  



class_sessions – id, classroomId, startedAt, endedAt, status (active/ended).  



realtime_feedback – id, sessionId, userId, value (e.g. 1–5 or enum), createdAt; optional: index on (sessionId, createdAt) for aggregates.  



post_class_feedback – id, sessionId, userId, optional text, understanding level, createdAt.  



feedback_summaries – id, sessionId, summaryText, insights (JSON or text), processedAt, jobId (from BullMQ).

Migrations: Drizzle Kit in packages/db; run drizzle-kit generate and drizzle-kit migrate from there (or from root script).



3. Auth (Better Auth + RBAC)





Better Auth mounted on Express with toNodeHandler under /api/auth/*. Do not use express.json() before this route; add it after or only for other routes.



Database: use Drizzle adapter with provider: "pg" and the same DB client from packages/db.



Admin plugin for user/role management; custom RBAC via createAccessControl and roles.

Roles  





admin – full app and user management (align with Better Auth admin plugin).  



instructor – create/manage classrooms and sessions; view real-time and post-class aggregates and summaries; no access to per-student identity in feedback (ethical requirement).  



student – join sessions; submit real-time and post-class feedback; view own history only.

Resources/permissions (example)  





classroom: create, read, update, delete, list.  



session: create, read, update, end, list.  



feedback: submit_realtime, submit_post_class, view_aggregate (instructor only).  



summary: read (instructor/admin).  



user / session (admin plugin): use default or merge with defaultStatements and adminAc.

Define ac and roles in e.g. packages/shared or apps/api/src/auth/permissions.ts, then pass to admin() and adminClient().

Login / logout
Use Better Auth’s built-in sign-in (e.g. email + password), sign-out, and session cookie. Frontend uses createAuthClient with adminClient() and the same ac/roles for permission checks and role-based UI.

API protection  





Middleware that calls auth.api.getSession({ headers: fromNodeHeaders(req.headers) }) and attaches session to req.  



Optional middleware that checks session.user.role or auth.api.userHasPermission for route-specific permissions (e.g. only instructor can GET /api/sessions/:id/aggregate).



4. Redis





Two uses: (1) BullMQ connection for queues, (2) caching.



Single Redis instance (or same connection options) in config; use ioredis (or Redis client compatible with BullMQ).

Caching (e.g. in Express)  





Cache active session metadata and aggregated real-time feedback (e.g. counts per level) keyed by sessionId, TTL e.g. 60s; invalidate when session ends or on purpose.  



Optionally cache summary by sessionId after first load.  



Use a thin wrapper in apps/api that reads/writes Redis and falls back to DB when missing.



5. BullMQ (queues and worker microservice)





Queue name (e.g. feedback-summarization) for “summarize post-class feedback for session X”.



Producer (in Express): when an instructor ends a session (or when post-class window closes), enqueue a job with payload { sessionId }. Optionally use delay so the job runs after a short buffer (e.g. 1 minute).



Worker (in apps/worker): separate Node process that runs a BullMQ Worker for feedback-summarization. Connection to Redis with maxRetriesPerRequest: null.  





On job: load post_class_feedback for sessionId (and optionally realtime aggregates) from DB, call your summarization step (e.g. LLM API or local NLP), write result to feedback_summaries, then invalidate cache for that session if used.



Retries: use BullMQ defaults or configure retries/backoff for transient failures.



No PostgreSQL for BullMQ storage; Redis only. Job metadata can be mirrored to DB in your app if needed (e.g. store jobId in feedback_summaries).

This worker process is your microservice for summarization; it can be deployed separately and scaled by increasing worker concurrency or instances.



6. Real-time feedback (during class)





WebSocket server on the Express app (e.g. ws or socket.io). Same origin or CORS as the Next.js app; auth: validate session (e.g. cookie or token sent on connection) using Better Auth getSession.



Channels/rooms: one room per sessionId. Students join room for current session; instructor joins same room for “live view”.



Student flow: send message (e.g. { type: 'feedback', value: 3 }) with Zod-validated payload; server broadcasts aggregated state (e.g. counts per level, no user ids) to the room so instructor sees trends without singling out individuals. Optionally persist a sample or aggregate to DB on a timer (e.g. every 30s write realtime_feedback rows or an aggregate row).



Persistence: either store each realtime event in realtime_feedback (with userId for optional analytics, but never exposed to instructor by user) or only periodic aggregates; ensure instructor-facing API and WS only return anonymized aggregates.



Multi-instance: if you run multiple API instances, use Redis Pub/Sub or a Redis-backed adapter so WS events are broadcast across instances (e.g. socket.io Redis adapter).



7. REST API (Express)





Base URL for frontend: e.g. http://localhost:3001 (API) vs Next.js on 3000; set NEXT_PUBLIC_API_URL and CORS on Express to allow the Next.js origin with credentials.



Auth: all protected routes use session middleware; then role/permission checks where needed.

Suggested endpoints (high level)  





Auth: POST /api/auth/* – handled by Better Auth; GET /api/me – session + user (and role).  



Classrooms: GET/POST /api/classrooms, GET/PATCH/DELETE /api/classrooms/:id (instructor/admin).  



Sessions: GET/POST /api/classrooms/:id/sessions, GET/PATCH /api/sessions/:id (e.g. end session → trigger BullMQ job), GET /api/sessions/:id/aggregate (instructor: real-time + post-class aggregates, anonymized).  



Feedback: POST /api/sessions/:id/feedback/realtime (optional if using only WS), POST /api/sessions/:id/feedback/post (post-class; body validated with Zod).  



Summaries: GET /api/sessions/:id/summary (instructor/admin; can cache in Redis).

Use Zod in API for request body validation (reuse schemas from packages/shared where possible).



8. Frontend (Next.js + TanStack + shadcn + Zod)





Next.js in apps/web (App Router or Pages; App Router recommended).



TanStack Query (React Query) for all server state: auth state, classrooms, sessions, aggregates, summaries. Call NEXT_PUBLIC_API_URL with credentials: 'include' so cookies are sent.



Better Auth client with adminClient() and same ac/roles; use for sign-in, sign-out, and hasPermission / role checks to show/hide UI and guard routes.



shadcn/ui for components; theme and layout as needed.



Zod: shared schemas from packages/shared for form validation and type safety with API payloads.

Key flows  





Login / logout: Better Auth client; redirect by role (e.g. instructor → dashboard, student → my sessions).  



Instructor: list classrooms → create/start session → “live session” page with WebSocket for real-time aggregate view; end session → post-class summary page (poll or refetch GET /api/sessions/:id/summary until worker has written result).  



Student: list “active” or “my” sessions → “during class” page: send real-time feedback (WS or REST) and/or post-class form (POST /api/sessions/:id/feedback/post).  



RBAC: hide instructor-only and admin-only sections based on hasPermission / role; protect API routes server-side in Express.



9. How to proceed (recommended order)





Scaffold monorepo: root package.json (workspaces), apps/api, apps/web, apps/worker, packages/db, packages/shared; ESM and TypeScript in all.



DB package: Drizzle config and PostgreSQL connection; add Better Auth schema (CLI generate) then app tables (classrooms, class_sessions, realtime_feedback, post_class_feedback, feedback_summaries); run migrations.



Auth: In apps/api, configure Better Auth with Drizzle adapter and admin plugin + custom RBAC (roles admin, instructor, student); mount toNodeHandler; add session middleware and optional permission middleware.



REST: Implement classrooms and sessions CRUD, feedback submit, aggregate and summary read endpoints; use Zod and Redis cache where planned.



Redis + BullMQ: Add queue in API and enqueue summarization job when session ends; implement worker in apps/worker with stub summarization (e.g. concatenate feedback text); then plug real summarization (e.g. LLM).



Real-time: Add WebSocket server to Express; room per session; student submit and broadcast aggregated feedback; instructor view; optionally persist to realtime_feedback and Redis for multi-instance.



Frontend: Next.js + TanStack Query + Better Auth client + shadcn; login/logout and role-based redirects; instructor and student flows; WS client for live session page.



Polish: Error handling, rate limiting, env validation (Zod), and deployment layout (API, worker, Next.js; single PostgreSQL and Redis).



10. Ethical requirement (no singling out)





Instructor views (REST and WebSocket) only expose aggregated or anonymized data (e.g. “70% level 4–5”, “common themes: …”).  



Never return raw feedback tied to user identity to instructors; store userId only for audit or optional “your history” for students.  



Summarization output should describe trends and themes, not “student X said Y.”



Key files to add (summary)







Area



Location



Purpose





Workspaces



Root package.json



pnpm/npm workspaces





Schema



packages/db/schema/



Drizzle tables (auth + app)





Auth config



apps/api/src/auth.ts



Better Auth + Drizzle adapter + admin + RBAC





Permissions



packages/shared or apps/api/src/auth/permissions.ts



createAccessControl, roles





Session middleware



apps/api/src/middleware/session.ts



getSession, attach to req





REST routes



apps/api/src/routes/



classrooms, sessions, feedback, summaries





Queue producer



apps/api/src/queues/summarization.ts



Add job on session end





Worker entry



apps/worker/src/index.ts



BullMQ Worker, summarization job





WS server



apps/api/src/ws/ or apps/api/src/realtime.ts



Rooms, broadcast aggregates





Next.js auth client



apps/web/lib/auth-client.ts



createAuthClient + adminClient





API client



apps/web/lib/api.ts



fetch + credentials, base URL

This gives you a clear path from an empty repo to a working backend (Express, Postgres, Drizzle, Redis, BullMQ, Better Auth, RBAC), a summarization worker microservice, real-time feedback, and a Next.js frontend that uses the API and respects roles and ethics.