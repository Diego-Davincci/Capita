# Plan: Enhanced Auth System

## Context

The current auth system uses JWT access+refresh token rotation stored in HTTP-only cookies, which protects against XSS and CSRF. However, tokens cannot be individually revoked before expiry, there is no session visibility, and there is no mechanism to block users. This plan adds session tracking, token rotation on refresh, user blocking, and a proper logout endpoint.

---

## Technical Architecture: Session + JWT Hybrid

### How better-auth works (pure session-based)

better-auth uses **opaque tokens** (random strings) stored in the DB. Every request hits the DB to validate the session — the DB is the single source of truth. This is simple but slow: every API call requires a `SELECT * FROM sessions WHERE token = $1`.

### How our system works (session + JWT hybrid)

We combine **stateless JWT access tokens** with **stateful session tracking**:

- **Access Token (AT):** Short-lived JWT (10 min). Verified by cryptographic signature alone — **zero DB calls on the hot path**. Contains `userID` and a unique `jti` (JWT ID) in the claims.
- **Refresh Token (RT):** Longer-lived JWT (12h). Also contains `userID` and a unique `jti`. The RT's `jti` is stored in the `sessions` table as the session identifier.
- **Sessions table:** Tracks active sessions with `refresh_token` (RT's jti), `user_agent`, `ip_address`, `expires_at`, `updated_at`. The DB is only consulted when the AT expires and the client presents the RT to get new tokens.

### Why this is better for us

|                        | better-auth (pure session)   | Our system (session + JWT)                 |
| ---------------------- | ---------------------------- | ------------------------------------------ |
| **Hot path**           | DB hit every request         | Zero DB calls (JWT signature check)        |
| **Revocation speed**   | Instant                      | Within AT expiry window (~10 min)          |
| **Session visibility** | Full (DB is source of truth) | On refresh path only                       |
| **Complexity**         | Simpler (one token type)     | Two token types + rotation logic           |
| **Scalability**        | DB bottleneck at scale       | Stateless on hot path, scales horizontally |

The tradeoff: blocking a user doesn't take effect instantly — it takes up to 10 minutes (the AT's lifetime). For a university marketplace, this is perfectly acceptable. We get the session tracking and admin tooling that better-auth provides, with the performance of stateless JWTs.

### Token rotation (replay attack prevention)

When the AT expires and the RT is used to refresh:

1. Look up the session by the RT's `jti` → if not found, session was deleted (expired or revoked) → 401
2. Check if the session has expired (`expires_at < now()`) → if yes, **delete it** and force re-login
3. Check `user.is_blocked` → if true, **delete all user sessions** and 401
4. Generate new AT + RT pair (new JTIs for both)
5. **Update the existing session** row: set `refresh_token = newRT.jti`, `updated_at = now()`
6. Set new cookies

This means the old RT's `jti` no longer matches any session row — if an attacker replays a stolen RT, the lookup fails → 401.

---

## Session Schema

```
sessions
├── session_id    UUID (PK, auto-generated)
├── user_id       bigint (FK → users)
├── refresh_token varchar (UNIQUE — stores RT's jti, NOT the full JWT string)
├── user_agent    text
├── ip_address    varchar
├── created_at    timestamptz
├── expires_at    timestamptz (= RT expiry time)
└── updated_at    timestamptz (tracks last token rotation)
```

No `is_active` / `revoked_at` — we **hard-delete** sessions instead of soft-deleting. Expired sessions are deleted on contact. Blocked user's sessions are bulk-deleted. Logout deletes the session. Simple.

No `access_jti` — we don't need the AT's id in the DB. The session is identified by the RT's `jti`, and the RT cookie is always available (both cookies are sent on every request).

---

## Flows

### Login

1. Google OAuth (unchanged)
2. Validate `@unal.edu.co` email (unchanged)
3. `UpsertUser()` + `UpdateUserLastSignIn()`
4. **Check `is_blocked`** → if true, redirect with error
5. `SetAuthCookies()` → creates AT+RT, inserts session row (RT's jti, user_agent, ip_address, expires_at)
6. Set `at` + `rt` HTTP-only cookies

### Authenticated Request (AT valid — hot path)

1. Extract `at` + `rt` cookies
2. Validate AT signature → valid → put `userID` in context → **done, no DB call**

### Token Refresh (AT expired)

1. AT expired → validate RT signature → if invalid, 401
2. Extract RT's `jti` → `SELECT * FROM sessions WHERE refresh_token = $1`
3. **Not found?** → session was deleted (logout/ban/expired cleanup) → 401
4. **`expires_at < now()`?** → delete session → 401 (force re-login)
5. Fetch user → **`is_blocked = true`?** → delete ALL user sessions → 401 with blocked message
6. Create new AT + RT (new JTIs)
7. **Update** existing session: `SET refresh_token = newRT.jti, updated_at = now()`
8. Set new cookies, put userID in context

### Logout

1. `POST /auth/logout` (authenticated)
2. Extract RT from cookie → validate → get `jti`
3. `DELETE FROM sessions WHERE refresh_token = $1`
4. Clear cookies (`MaxAge: -1`)

### Blocking a User (future admin feature)

1. Set `users.is_blocked = true`
2. `DELETE FROM sessions WHERE user_id = $1` (all sessions gone)
3. Next AT expiry → refresh attempt → user fetch → blocked → 401
4. Login attempt → blocked check → redirect with error

---

## Implementation — Code Changes

### 1. DB Migration 00005: Enhance users table (already created)

**File**: `server/internal/db/migrations/00005_users_table_auth_enhacements.sql` — **no changes needed**, already correct.

### 2. DB Migration 00006: Sessions table (needs update) ✅

**File**: `server/internal/db/migrations/00006_sessions_table.sql`

**Before** (current):

```sql
CREATE TABLE sessions(
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id bigint NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    refresh_token varchar NOT NULL UNIQUE,
    access_jti varchar NOT NULL,
    user_agent text NOT NULL DEFAULT '',
    ip_address varchar NOT NULL DEFAULT '',
    created_at timestamptz NOT NULL DEFAULT now(),
    expires_at timestamptz NOT NULL,
    revoked_at timestamptz,
    is_active  boolean NOT NULL DEFAULT true
);
```

**After**:

```sql
CREATE TABLE sessions(
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id bigint NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    refresh_token varchar NOT NULL UNIQUE,  -- RT's jti (UUID string)
    user_agent text NOT NULL DEFAULT '',
    ip_address varchar NOT NULL DEFAULT '',
    created_at timestamptz NOT NULL DEFAULT now(),
    expires_at timestamptz NOT NULL,        -- same as RT expiry
    updated_at timestamptz NOT NULL DEFAULT now()  -- tracks last token rotation
);
```

Changes: removed `access_jti`, `revoked_at`, `is_active`. Added `updated_at`. Removed `idx_sessions_access_jti` index.

---

### 3. SQL Queries — `server/internal/db/queries/users.sql` ✅

**Remove** admin-only queries (deferred to admin feature): `BlockUser`, `UnBlockUser`, `GetUsersForAdmin`, `GetUserCountForAdmin`.

**Keep**: `GetUserBySocialID`, `GetUserByID`, `CreateUser`, `UpdateUser`, `UpdateUserLastSignIn`.

### 4. SQL Queries — `server/internal/db/queries/sessions.sql` (rewrite) ✅

**Before** (current):

```sql
-- name: CreateSession :one
INSERT INTO sessions (user_id, refresh_token, access_jti, user_agent, ip_address, expires_at)
VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;

-- name: GetSessionByRefreshTokenHash :one
SELECT * FROM sessions WHERE refresh_token = $1 AND is_active = true;

-- name: GetActiveSessionByUserID :many
SELECT * FROM sessions WHERE user_id = $1 AND is_active = true ORDER BY created_at DESC;

-- name: GetSessionByID :one
SELECT * FROM sessions WHERE session_id = $1;

-- name: RevokeSessionByAccessJTI :exec
UPDATE sessions SET is_active = false, revoked_at = now()
WHERE access_jti = $1 AND is_active = true;

-- name: RevokeAllSessionsByUserID :exec
UPDATE sessions SET is_active = false, revoked_at = now()
WHERE user_id = $1 AND is_active = true;
```

**After**:

```sql
-- name: CreateSession :one
INSERT INTO sessions (user_id, refresh_token, user_agent, ip_address, expires_at)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: GetSessionByRefreshToken :one
SELECT * FROM sessions WHERE refresh_token = $1;

-- name: UpdateSessionToken :exec
UPDATE sessions SET refresh_token = $1, updated_at = now() WHERE session_id = $2;

-- name: DeleteSession :exec
DELETE FROM sessions WHERE refresh_token = $1;

-- name: DeleteAllSessionsByUserID :exec
DELETE FROM sessions WHERE user_id = $1;
```

> Run `make sqlc` after updating both query files.

---

### 5. `server/internal/utils/jwt.go` — no changes needed ✅

Already returns `(refreshToken, accessToken, refreshJTI, accessJTI string, err error)` with UUIDs in both JTIs. We'll use `refreshJTI` as the session identifier stored in `refresh_token` column.

### 6. `server/internal/utils/context.go` — remove `SessionIDContextKey` ✅

**Before**:

```go
const UserContextKey      AuthContext = "user"
const SessionIDContextKey AuthContext = "session_id"
```

**After**:

```go
const UserContextKey AuthContext = "user"
```

We no longer need a session ID in context. Logout reads the RT cookie directly.

---

### 7. `server/internal/auth/service.go` ✅

**Interface changes**:

```go
type Service interface {
    RedirectToGoogleUrl() string
    GetGoogleUserData(ctx context.Context, googleCode string) (userData googleUser, err error)
    CheckUserEmail(email string) (err error)
    UpsertUser(ctx context.Context, userData googleUser) (user repo.User, err error)
    // SetAuthCookies creates tokens, inserts a new session, and sets cookies.
    SetAuthCookies(ctx context.Context, w http.ResponseWriter, r *http.Request, userID int64) error
    // RotateSession updates an existing session with a new RT jti and sets new cookies.
    RotateSession(ctx context.Context, w http.ResponseWriter, r *http.Request, userID int64, sessionID pgtype.UUID) error
    // CheckUserBlocked returns an error if the user is blocked.
    CheckUserBlocked(ctx context.Context, userID int64) error
    // LogoutUser deletes the session and clears cookies.
    LogoutUser(ctx context.Context, w http.ResponseWriter, refreshJTI string) error
}
```

**`SetAuthCookies`** (used on login — creates new session):

```go
func (s *authService) SetAuthCookies(ctx context.Context, w http.ResponseWriter, r *http.Request, userID int64) error {
    refreshToken, accessToken, refreshJTI, _, err := utils.CreateTokens(userID, ...)
    if err != nil { return err }

    expiresAt := time.Now().Add(s.config.RefreshTokenTime)
    _, err = s.repo.CreateSession(ctx, repo.CreateSessionParams{
        UserID:       userID,
        RefreshToken: refreshJTI,          // store RT's jti, not the full JWT
        UserAgent:    r.Header.Get("User-Agent"),
        IpAddress:    r.RemoteAddr,
        ExpiresAt:    pgtype.Timestamptz{Time: expiresAt, Valid: true},
    })
    if err != nil { return err }

    s.setCookies(w, refreshToken, accessToken)
    return nil
}
```

**`RotateSession`** (used on refresh — updates existing session):

```go
func (s *authService) RotateSession(ctx context.Context, w http.ResponseWriter, r *http.Request, userID int64, sessionID pgtype.UUID) error {
    refreshToken, accessToken, refreshJTI, _, err := utils.CreateTokens(userID, ...)
    if err != nil { return err }

    // Update the existing session row with the new RT's jti
    err = s.repo.UpdateSessionToken(ctx, repo.UpdateSessionTokenParams{
        RefreshToken: refreshJTI,
        SessionID:    sessionID,
    })
    if err != nil { return err }

    s.setCookies(w, refreshToken, accessToken)
    return nil
}
```

**`LogoutUser`** (deletes session + clears cookies):

```go
func (s *authService) LogoutUser(ctx context.Context, w http.ResponseWriter, refreshJTI string) error {
    err := s.repo.DeleteSession(ctx, refreshJTI)
    if err != nil { return err }

    http.SetCookie(w, &http.Cookie{Name: "at", MaxAge: -1, Path: "/"})
    http.SetCookie(w, &http.Cookie{Name: "rt", MaxAge: -1, Path: "/"})
    return nil
}
```

**`setCookies`** (private helper, extracted from current `SetAuthCookies`):

```go
func (s *authService) setCookies(w http.ResponseWriter, refreshToken, accessToken string) {
    var sameSite http.SameSite
    var domain string
    if s.config.Domain != "localhost" {
        sameSite = http.SameSiteNoneMode
        domain = ""
    } else {
        sameSite = http.SameSiteLaxMode
        domain = s.config.Domain
    }

    maxTime := 315360000000 // 10 year
    http.SetCookie(w, &http.Cookie{Name: "rt", Value: refreshToken, Path: "/", Domain: domain, Secure: s.config.SecureCookies, HttpOnly: true, SameSite: sameSite, MaxAge: maxTime})
    http.SetCookie(w, &http.Cookie{Name: "at", Value: accessToken, Path: "/", Domain: domain, Secure: s.config.SecureCookies, HttpOnly: true, SameSite: sameSite, MaxAge: maxTime})
}
```

**`SetAuthCookies` no longer returns `accessJTI`** — we don't need it in context anymore.

---

### 8. `server/internal/auth/middleware.go` ✅

**Before** (current code):

```go
func (m *middleware) Auth(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        // ... get cookies, validate AT ...
        // AT valid path: stores accessJTI in SessionIDContextKey
        // AT expired path: revokes old session, creates new session via SetAuthCookies
    })
}
```

**After**:

```go
func (m *middleware) Auth(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        // (1) Get cookies
        refreshToken, err := r.Cookie("rt")
        if err != nil {
            utils.WriteResponse(w, http.StatusUnauthorized, nil, "petición no autorizada")
            return
        }
        accessToken, err := r.Cookie("at")
        if err != nil {
            utils.WriteResponse(w, http.StatusUnauthorized, nil, "petición no autorizada")
            return
        }

        // (2) Validate AT signature
        atClaims, atErr := utils.ValidateToken(accessToken.Value, m.config.AccessTokenKey)
        if atErr == utils.ErrInvalidToken {
            utils.WriteResponse(w, http.StatusUnauthorized, nil, "petición no autorizada")
            return
        }

        // (3) AT is valid — NO DB hit, trust JWT signature
        if atErr == nil {
            ctx := context.WithValue(r.Context(), utils.UserContextKey, atClaims.UserID)
            next.ServeHTTP(w, r.WithContext(ctx))
            return
        }

        // (4) AT expired — validate RT
        rtClaims, rtErr := utils.ValidateToken(refreshToken.Value, m.config.RefreshTokenKey)
        if rtErr != nil {
            utils.WriteResponse(w, http.StatusUnauthorized, nil, "petición no autorizada")
            return
        }

        // (5) Look up session by RT's jti
        session, sessionErr := m.repo.GetSessionByRefreshToken(r.Context(), rtClaims.ID)
        if sessionErr != nil {
            log.Println("session not found for refresh token jti", sessionErr)
            utils.WriteResponse(w, http.StatusUnauthorized, nil, "petición no autorizada")
            return
        }

        // (6) Check session expiry — if expired, delete it and force re-login
        if session.ExpiresAt.Time.Before(time.Now()) {
            _ = m.repo.DeleteSession(r.Context(), session.RefreshToken)
            utils.WriteResponse(w, http.StatusUnauthorized, nil, "petición no autorizada")
            return
        }

        // (7) Fetch user, check is_blocked
        user, err := m.repo.GetUserByID(r.Context(), rtClaims.UserID)
        if err != nil {
            log.Println("error getting user by id", err)
            utils.WriteResponse(w, http.StatusInternalServerError, nil, utils.ErrInternalServerProblem.Error())
            return
        }

        if user.IsBlocked {
            // Delete ALL sessions for this user
            _ = m.repo.DeleteAllSessionsByUserID(r.Context(), user.UserID)
            utils.WriteResponse(w, http.StatusUnauthorized, nil,
                "Tu cuenta ha sido bloqueada. ¡Parece que te portaste muy mal! 🤡")
            return
        }

        // (8) Rotate: update existing session with new RT jti, issue new cookies
        if err := m.service.RotateSession(r.Context(), w, r, user.UserID, session.SessionID); err != nil {
            log.Println("error rotating session", err)
            utils.WriteResponse(w, http.StatusInternalServerError, nil, utils.ErrInternalServerProblem.Error())
            return
        }

        ctx := context.WithValue(r.Context(), utils.UserContextKey, user.UserID)
        next.ServeHTTP(w, r.WithContext(ctx))
    })
}
```

Key differences from before:

- No `SessionIDContextKey` — removed entirely
- **Update** existing session instead of create new + revoke old
- **Hard-delete** expired sessions on contact
- **Hard-delete all** sessions when user is blocked
- Session lookup uses `rtClaims.ID` (RT's jti) instead of the raw token string

---

### 9. `server/internal/auth/controller.go` ✅

**`GoogleOauthCallback`** — already has blocked check + updated `SetAuthCookies` call. One fix needed: `SetAuthCookies` no longer returns `accessJTI`, it returns just `error`.

**Before**:

```go
if _, err = c.service.SetAuthCookies(r.Context(), w, r, user.UserID); err != nil {
```

**After**:

```go
if err = c.service.SetAuthCookies(r.Context(), w, r, user.UserID); err != nil {
```

**`Logout`** — rewritten to use RT cookie directly instead of context:

**Before**:

```go
func (c *authController) Logout(w http.ResponseWriter, r *http.Request) {
    accessJTI := r.Context().Value(utils.SessionIDContextKey).(string)
    if err := c.service.LogoutUser(r.Context(), w, accessJTI); err != nil {
        ...
    }
}
```

**After**:

```go
func (c *authController) Logout(w http.ResponseWriter, r *http.Request) {
    // Read RT cookie to get the refresh token's jti for session lookup
    rtCookie, err := r.Cookie("rt")
    if err != nil {
        utils.WriteResponse(w, http.StatusUnauthorized, nil, "petición no autorizada")
        return
    }

    rtClaims, rtErr := utils.ValidateToken(rtCookie.Value, c.config.RefreshTokenKey)
    if rtErr != nil {
        // Even if RT is expired/invalid, clear cookies anyway
        http.SetCookie(w, &http.Cookie{Name: "at", MaxAge: -1, Path: "/"})
        http.SetCookie(w, &http.Cookie{Name: "rt", MaxAge: -1, Path: "/"})
        utils.WriteResponse(w, http.StatusOK, nil, "sesión cerrada exitosamente")
        return
    }

    if err := c.service.LogoutUser(r.Context(), w, rtClaims.ID); err != nil {
        log.Println("error during logout", err)
        utils.WriteResponse(w, http.StatusInternalServerError, nil, utils.ErrInternalServerProblem.Error())
        return
    }

    utils.WriteResponse(w, http.StatusOK, nil, "sesión cerrada exitosamente")
}
```

**Also fix**: `userBlockedRedirectURL` on line 29 is missing the `c.config.Website` argument in `Sprintf`.

---

### 10. Client changes (minimal — no admin) ✅

**`client/src/features/auth/types/index.ts`** — remove `isUserValid`, add `isBlocked`:

```ts
export interface User {
  userID: number;
  email: string;
  username: string;
  picture: string;
  isBlocked: boolean; // NEW — replaces isUserValid
  shopName?: string | null;
  shopDescription?: string | null;
  phoneNumber?: string | null;
}
```

> `isAdmin` deferred to admin feature.

**`client/src/store/store.ts`** — remove `isUserValid` from initial state, add `isBlocked: false`.

**`client/src/features/auth/hooks/use-me.ts`** — expose `isBlocked`:

```ts
const [isBlocked, setIsBlocked] = useState<boolean>(false);

// In catch block:
if (err.statusCode === 401 && err.message?.includes("bloqueada")) {
  setIsBlocked(true);
}

return { error, loading, isBlocked };
```

**`client/src/features/auth/components/blocked-page.tsx`** — new component for blocked users.

**`client/src/main.tsx`** — handle `isBlocked`:

```tsx
const { loading, error, isBlocked } = useMe();
if (isBlocked) {
  return <BlockedPage />;
}
```

> Admin routes (`_admin.tsx`, admin feature) deferred to future plan.

---

## Removed from this plan (deferred to admin feature)

- Admin dashboard frontend (`client/src/features/admin/`)
- Admin routes (`_admin.tsx`, `_admin/admin.tsx`)
- `RequireAdmin` middleware
- Admin backend endpoints (`GET /admin/users`, `PATCH /admin/users/:id/block`, etc.)
- `isAdmin` in client types/store/router context
- Admin SQL queries (`BlockUser`, `UnBlockUser`, `GetUsersForAdmin`, `GetUserCountForAdmin`)
- `GetActiveSessionByUserID`, `GetSessionByID` queries (admin-only)

---

## Critical Files Summary

| File                                                   | Change                                                                                                                                   |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `server/internal/db/migrations/00005_*.sql`            | Already created — no changes                                                                                                             |
| `server/internal/db/migrations/00006_*.sql`            | Update: remove `access_jti`, `is_active`, `revoked_at`; add `updated_at`                                                                 |
| `server/internal/db/queries/users.sql`                 | Remove admin queries (BlockUser, UnBlockUser, GetUsersForAdmin, GetUserCountForAdmin)                                                    |
| `server/internal/db/queries/sessions.sql`              | Rewrite: CreateSession, GetSessionByRefreshToken, UpdateSessionToken, DeleteSession, DeleteAllSessionsByUserID                           |
| `server/internal/utils/jwt.go`                         | No changes needed                                                                                                                        |
| `server/internal/utils/context.go`                     | Remove `SessionIDContextKey`                                                                                                             |
| `server/internal/auth/service.go`                      | Rewrite: `SetAuthCookies` (no return), new `RotateSession`, rewrite `LogoutUser` (delete instead of revoke), extract `setCookies` helper |
| `server/internal/auth/middleware.go`                   | Rewrite: session lookup by RT jti, hard-delete expired, delete-all on blocked, update-in-place on rotation                               |
| `server/internal/auth/controller.go`                   | Fix `SetAuthCookies` call, rewrite `Logout` to use RT cookie directly, fix `Sprintf` bug                                                 |
| `client/src/features/auth/types/index.ts`              | Remove `isUserValid`, add `isBlocked`                                                                                                    |
| `client/src/store/store.ts`                            | Remove `isUserValid`, add `isBlocked: false`                                                                                             |
| `client/src/features/auth/hooks/use-me.ts`             | Expose `isBlocked`                                                                                                                       |
| `client/src/features/auth/components/blocked-page.tsx` | NEW                                                                                                                                      |
| `client/src/main.tsx`                                  | Handle `isBlocked` → render `BlockedPage`                                                                                                |

## Execution Order

1. Update migration `00006_sessions_table.sql`
2. Update `queries/users.sql` (remove admin queries) + rewrite `queries/sessions.sql` → `make sqlc`
3. Update `utils/context.go` (remove `SessionIDContextKey`)
4. Rewrite `auth/service.go`
5. Rewrite `auth/middleware.go`
6. Update `auth/controller.go`
7. Client: types → store → `use-me` → `blocked-page` → `main.tsx`

## Verification

- Login creates a session row with RT's jti
- Hot path (AT valid): zero DB calls, user reaches endpoint
- AT expires → refresh → session updated in-place (new RT jti in `refresh_token` column, `updated_at` bumped)
- Old RT replayed after rotation → session lookup fails (jti no longer matches) → 401
- Expired session (`expires_at < now()`) → deleted on contact → 401
- Blocked user's AT expires → all sessions deleted → 401 with blocked message
- Blocked user tries to log in → redirect with error
- `POST /auth/logout` → session deleted → cookies cleared → refreshing page goes to login
- `go build ./...` and `npm run build` pass
