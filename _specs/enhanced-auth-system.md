# Spec for Enhanced Auth System

## Summary

Enhance the existing JWT-based authentication system (access token + refresh token rotation, HTTP-only cookies) to improve security, observability, and admin control. Inspired by better-auth, the enhancements include richer session/token metadata stored in the DB, a token blocklist for instant revocation, and an admin dashboard to visualize users, sessions, and block/unblock accounts. The `@unal.edu.co` domain restriction and Google OAuth flow remain unchanged.

## Functional Requirements

### Database Schema Enhancements

- Add a `sessions` table to track active sessions with metadata: `session_id`, `user_id` (FK), `refresh_token_hash`, `user_agent`, `ip_address`, `created_at`, `expires_at`, `revoked_at` (nullable), `is_active`.
- Add a `token_blocklist` table to store revoked JWTs that have not yet expired: `jti` (JWT ID), `expires_at`.
- Add a `jti` (JWT ID) claim to all issued access tokens and refresh tokens.
- Store a hashed version of the refresh token in the `sessions` table instead of the raw token.
- Add `last_sign_in_at` and `is_blocked` columns to the `users` table.

### Token & Session Lifecycle

- On successful Google OAuth callback, create a new session record in the DB alongside setting cookies.
- On token refresh, invalidate the old refresh token's session record and create a new session (full rotation).
- On explicit logout, mark the session as revoked and add the access token's `jti` to the `token_blocklist`.
- On every authenticated request, check the access token's `jti` against the `token_blocklist`; reject if found.
- Automatically clean up expired records from `token_blocklist` and expired/revoked sessions (via a background job or on-read pruning).

### User Blocking

- Admins can block a user, setting `users.is_blocked = true`.
- Blocked users are rejected at the auth middleware layer on every request (after JWT validation).
- Blocking a user immediately revokes all their active sessions (marks them revoked and adds all active `jti`s to the blocklist).
- Blocked users cannot complete the Google OAuth callback (server rejects them before issuing tokens).

### Admin Dashboard (Web UI)

- A protected admin-only route/page accessible only to users with an `is_admin` flag (new column on `users`).
- The dashboard displays a paginated list of all users with: avatar, email, username, registration date, last sign-in date, number of active sessions, and blocked status.
- Admin can block or unblock any user directly from the dashboard.
- Admin can view and force-revoke individual sessions for any user.
- Dashboard shows a summary card: total users, active sessions, blocked users.

### API Endpoints

- `GET /admin/users` — paginated user list with session counts (admin only).
- `PATCH /admin/users/:user_id/block` — block a user and revoke all their sessions.
- `PATCH /admin/users/:user_id/unblock` — unblock a user.
- `GET /admin/users/:user_id/sessions` — list active sessions for a user.
- `DELETE /admin/sessions/:session_id` — force-revoke a specific session.
- `POST /auth/logout` — log out current session (revoke session + blocklist access token).

## Possible Edge Cases

- Race condition between refresh token rotation and blocklist check if two requests use the same refresh token simultaneously — the second rotation attempt should be rejected and the session revoked entirely (detect token reuse).
- Admin blocking themselves — should be prevented or require a super-admin role.
- Token blocklist growing unboundedly — expired entries must be pruned regularly to avoid performance degradation.
- A user whose session is force-revoked mid-request should receive a 401 on the next authenticated call, not the current in-flight one.
- `jti` must be globally unique; use UUIDs.
- Refresh token hash collisions (extremely unlikely with a strong hash, but the schema should enforce uniqueness on `refresh_token_hash`).
- Admin dashboard must not be accessible from the regular client bundle if role is not `is_admin` — enforce both server-side and client-side route guards.

## Acceptance Criteria

- Logging out via `POST /auth/logout` immediately prevents the revoked access token from being used again (blocklist check returns 401).
- Full refresh token rotation: reusing an old refresh token after it has been rotated returns 401 and revokes the entire session.
- Blocking a user via the admin dashboard causes all subsequent requests from that user to return 401 within one request cycle (no waiting for token expiry).
- The admin dashboard renders a paginated user list and correctly reflects blocked/active status in real time after a block/unblock action.
- A non-admin authenticated user hitting any `/admin/*` route receives 403.
- Session metadata (IP, user agent, created_at) is stored and visible in the admin session view.
- Expired blocklist entries and expired sessions are pruned so they do not accumulate indefinitely.
- All existing auth flows (`@unal.edu.co` restriction, Google OAuth, cookie-based JWT) continue to work without regression.

## Open Questions

- Should `is_admin` be seeded manually (e.g., via a migration or env var for the first admin) or managed through the dashboard itself? Let's add some db column to allow manually some users to be admins
- What is the desired cleanup strategy for the `token_blocklist` — a periodic cron job, a middleware side-effect on each request, or a DB-level TTL/partition? Let's not add a clean up for now
- Should the admin dashboard be part of the existing React client (behind a protected route) or a separate standalone page? It should be a different page inside the React app
- Do we want to support multiple OAuth providers in the future, or remain Google-only? This affects how `sessions` and `users` tables are structured. Let's keep google only for now
- Should force-revoking a session also send a notification to the affected user (e.g., email)? No, when blocking a user, let's show them a funny message telling them that they are blocked
- What level of rate limiting should be applied to the token refresh endpoint to mitigate brute-force token reuse attacks? Not yet
