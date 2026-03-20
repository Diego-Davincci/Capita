# Plan: Navbar Post Search

**Spec:** `_specs/navbar-post-search.md`
**Branch:** `feat/navbar-post-search`

---

## Pre-existing bugs fixed by this work

- **Category filter is broken:** `feed-page.tsx` reads `category` from URL but never passes it to the API (`// TODO` comment on line 23). Fixed here.
- **Static query key:** `queryKey: ['feed-category']` never changes, so category navigation never triggers a refetch. Fixed by including all search params in the key.

---

## Execution Order

| # | Area | File(s) | Action |
|---|------|---------|--------|
| 1 | DB | `server/internal/db/queries/posts.sql` | Extend WHERE + LIMIT/OFFSET |
| 2 | DB | run `make sqlc` | Regenerate sqlc types |
| 3 | Go | `server/internal/posts/service.go` | Extend struct + service call |
| 4 | Go | `server/internal/posts/controller.go` | Pass new params |
| 5 | TS | `client/src/hooks/use-debounce.ts` | New hook |
| 6 | TS | `client/src/routes/_authenticated/_layout/index.tsx` | Add `q`, `page` to search params |
| 7 | TS | `client/src/components/layout/navbar.tsx` | Wire debounced input to URL |
| 8 | TS | `client/src/features/home/components/feed-page.tsx` | Fix category bug + search + pagination + empty state |

---

## Step 1 — Extend the SQL query

**File:** `server/internal/db/queries/posts.sql`

Modify `GetFeedPosts` to accept two new sqlc params: `search` (text) and `page` (int).
Add `ILIKE` filters across `title`, `description`, `username`, and `shop.name`.
Change `LIMIT sqlc.arg(max)` to `LIMIT 9 OFFSET sqlc.arg(page)::int * 9`.

```sql
WHERE (sqlc.arg(category)::text = '' OR p.category = sqlc.arg(category)::text)
  AND (
    sqlc.arg(search)::text = ''
    OR p.title        ILIKE '%' || sqlc.arg(search)::text || '%'
    OR p.description  ILIKE '%' || sqlc.arg(search)::text || '%'
    OR u.username     ILIKE '%' || sqlc.arg(search)::text || '%'
    OR s.name         ILIKE '%' || sqlc.arg(search)::text || '%'
  )
LIMIT 9
OFFSET sqlc.arg(page)::int * 9;
```

## Step 2 — Regenerate sqlc

```bash
make sqlc
```

## Step 3 — Extend query struct & service

**File:** `server/internal/posts/service.go`

Add `Search` and `Page` to `GetPostsQueries`. Pass both to the repo call in `GetPosts`.

```go
type GetPostsQueries struct {
  Category string `json:"category" validate:"omitempty"`
  Search   string `json:"search"   validate:"omitempty,max=100"`
  Page     int    `json:"page"     validate:"omitempty,min=0"`
}
```

Update `GetPosts` signature and call:
```go
func (s *postsService) GetPosts(ctx context.Context, category, search string, page int) ([]repo.GetFeedPostsRow, error) {
  return s.repo.GetFeedPosts(ctx, repo.GetFeedPostsParams{
    Category: category,
    Search:   search,
    Page:     int32(page),
  })
}
```

## Step 4 — Update controller

**File:** `server/internal/posts/controller.go`

Extract `Search` and `Page` from query context and pass to service:

```go
func (c *postsController) GetAllPosts(w http.ResponseWriter, r *http.Request) {
  ctx := r.Context()
  params := r.Context().Value(middleware.QueryCtxKey).(GetPostsQueries)

  posts, err := c.service.GetPosts(ctx, params.Category, params.Search, params.Page)
  // ... existing error handling unchanged
  utils.WriteResponse(w, http.StatusOK, posts, "")
}
```

## Step 5 — Create `useDebounce` hook

**File:** `client/src/hooks/use-debounce.ts` _(new file)_

Generic hook that delays a value update by `delay` ms. Cleans up on unmount/value change to prevent stale updates.

```ts
/**
 * Delays updating the returned value until `delay` ms have passed
 * since the last change to `value`. Useful for deferring API calls
 * until the user stops typing.
 *
 * @test: value changes rapidly → only the last value is emitted after delay
 * @test: delay=0 → behaves like direct state (emits immediately on next tick)
 * @test: component unmounts mid-delay → no state update after unmount
 */
function useDebounce<T>(value: T, delay: number): T
```

## Step 6 — Extend route search params

**File:** `client/src/routes/_authenticated/_layout/index.tsx`

Add `q` and `page` to `HomeParams` and `validateSearch`:

```ts
type HomeParams = {
  category?: string;
  q?: string;
  page?: number;
};

validateSearch: (search: Record<string, unknown>): HomeParams => ({
  category: search?.category as string | undefined,
  q: search?.q as string | undefined,
  page: search?.page ? Number(search.page) : undefined,
}),
```

## Step 7 — Wire up the Navbar

**File:** `client/src/components/layout/navbar.tsx`

Changes:
- Add local `inputValue` state (immediate, controls the input display).
- Initialize `inputValue` from `q` URL param via `useSearch` (so back-navigation restores the input).
- Apply `useDebounce(inputValue, 400)` → when debounced value settles, call:
  ```ts
  navigate({ to: "/", search: (prev) => ({ ...prev, q: debouncedValue || undefined, page: undefined }) })
  ```
- Remove `disabled={pathNotHome}`. When not on home, navigate to `/` and set `q` simultaneously.
- Add `maxLength={100}` on the `<Input>`.
- Add `onKeyDown`: clear local state + remove `q` from URL on `Escape`.
- Add `aria-label="Buscar publicaciones"` for accessibility.
- Add a clear (×) `<button>` inside the input, visible only when `inputValue` is non-empty.
- Ensure layout is responsive (input should collapse or become an icon on small screens — see existing `// TODO: responsive navbar`).

## Step 8 — Update Feed Page

**File:** `client/src/features/home/components/feed-page.tsx`

Changes:
- Read `category`, `q`, and `page` from `useSearch`.
- Build API URL dynamically with a `buildUrl` utility (see below), filtering out undefined/empty values.
- Update query key to include all params — this fixes the pre-existing category bug too:
  ```ts
  queryKey: ['feed', { category, q, page }]
  ```
- Add **empty state**: when `data` is an empty array and `!isLoading`, render a message like _"No encontramos publicaciones para «{q}»"_.
- Add **"Cargar más" button**: visible when the current page returned exactly 9 results (not the last page). On click, navigate:
  ```ts
  navigate({ search: (prev) => ({ ...prev, page: (prev.page ?? 0) + 1 }) })
  ```
  Note: each page navigation replaces the feed — TanStack Query caches prior pages. A future iteration can upgrade to `useInfiniteQuery` for accumulated results.

### `buildUrl` utility

Add to `client/src/lib/api/client.ts` (or a new `client/src/lib/api/utils.ts`):

```ts
/**
 * Builds a URL with query params, omitting keys whose value is
 * undefined, null, or empty string.
 *
 * @test: all params undefined → returns base url unchanged
 * @test: special chars in value → correctly percent-encoded
 */
function buildUrl(base: string, params: Record<string, string | number | undefined>): string
```

---

## Out of scope (v1)

- Autocomplete / search history
- `useInfiniteQuery` for accumulated pagination (deferred)
- Full-text search index (ILIKE sufficient at this scale)
