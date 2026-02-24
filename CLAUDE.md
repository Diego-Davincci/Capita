# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Cápita is a fullstack monorepo — a social marketplace for Universidad Nacional de Colombia (Medellín) students to buy/sell products and services. Only `@unal.edu.co` email accounts can register (enforced server-side via Google OAuth).

---

## Commands

### Client (`/client`)

```bash
npm run dev       # Start Vite dev server (port 5173)
npm run build     # TypeScript check + Vite production build
npm run lint      # ESLint
npm run preview   # Preview production build
```

### Server (`/server`)

```bash
# Development (hot reload via Air)
air

# Build & run manually
go build -o bin/main ./cmd && ./bin/main

# Database
make create_db    # Docker compose up PostgreSQL (capita-db container)
make migration    # Create a new Goose SQL migration
make sqlc         # Re-generate Go code from SQL queries (run after editing queries/)
```

After editing any file in `server/internal/db/queries/`, always run `make sqlc` to regenerate `internal/db/sqlc/`.

---

## Architecture

### Stack

- **Client:** React 19 + TypeScript, TanStack Router (file-based), TanStack Query, Zustand, Tailwind CSS v4, shadcn/ui, Zod
- **Server:** Go + Chi router, sqlc (type-safe SQL), pgx/pgxpool, Google OAuth 2.0, JWT (HTTP-only cookies), AWS S3
- **DB:** PostgreSQL 16 via Docker, migrations with Goose

### Client Structure (`client/src/`)

Feature-based organization under `features/`:

- `features/auth/` — Google OAuth login flow
- `features/home/` — Posts feed + sell post modal
- `features/profile/` — User profile

Cross-feature shared code:

- `hooks/` — `useMe`, `useApiMutation`, `useApiQuery` (wrappers over React Query)
- `lib/api/` — Raw HTTP helpers: `getHttpRequest<T>()` and `mutationHttpRequest<P, R>()`
- `store/` — Zustand store with global user state
- `routes/` — TanStack Router file-based routes (auth guard via `RouterContext.isAuthorized`)
- `components/ui/` — shadcn/ui components

**API response shape:** `{ data: T, message: string, statusCode: number }` — defined in `types/`.

**Auth:** JWT stored in HTTP-only cookies (`at` = access token 10min, `rt` = refresh token 12h). The client always sends `credentials: 'include'`. Token refresh is handled transparently by server middleware.

### Server Structure (`server/`)

```
cmd/
  main.go     # Entry point: loads config, inits DB, wires dependencies
  api.go      # Chi router setup, middleware stack, route registration
internal/
  auth/       # Google OAuth controller/service, JWT middleware, /me endpoint
  posts/      # Post CRUD controller/service, S3 upload
  db/
    migrations/   # Goose SQL migrations (run in order)
    queries/      # Raw SQL for sqlc input
    sqlc/         # Auto-generated — do not edit manually
  utils/          # Config (Viper), JWT helpers, JSON response writer, validator
```

**Layered pattern:** Controller → Service → sqlc DB queries. Controllers validate/parse, services contain logic.

**Standardized response writer:** `utils.WriteResponse(w, data, message, statusCode)` — used in every handler.

**Config:** Loaded via Viper from `.env`. Key env vars: `PORT`, `DB_SOURCE`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `WEBSITE` (frontend URL for CORS/cookies), `BUCKET_NAME`, `AWS_REGION`.

### Auth Flow

1. Frontend hits `GET /auth/google` → server returns Google OAuth URL
2. User authenticates; Google redirects to `GET /auth/google/callback`
3. Server validates `@unal.edu.co` email, creates/updates user in DB, sets `at`+`rt` cookies
4. Frontend calls `GET /auth/me` → stores user in Zustand

### API Endpoints

```
GET  /health
GET  /auth/google
GET  /auth/google/callback
GET  /auth/me              (authenticated)
POST /posts                (authenticated, multipart/form-data)
GET  /posts                (authenticated, ?category= filter)
```

### Database

- **Users:** `user_id`, `social_id` (Google ID), `email`, `username`, `picture`, `is_user_valid`, `registered_at`
- **Posts:** `post_id`, `user_id` (FK), `title` (≤80), `description` (≤1000), `price`, `category`, `photo_url` (S3), `registered_at`, `updated_at`

Post images are validated server-side (JPG/JPEG/PNG only, max 10MB) and uploaded to S3 before the DB record is created.

## Claude Preferences

- Always act as a senior software engineer: produce high-quality code that follows instructions carefully and precisely.
- Save memory context (decisions, patterns, preferences) to this file so it persists across sessions.
- Fronted 👉 When creating hooks/medium size functions or bigger, make sure to add a brief jsdoc comment to understand better the code.
- Frontend 👉 When creating new components, custom hooks, functions, add a comment with test cases.
- Backend 👉 When producing new Go code, make sure to add a brief comment explaining its functionality and also add test cases as comment.
