# Plan: Infinite Scroll Feed (v3 — md5 hash + cursor pagination)

**Spec:** `_specs/infinite-scroll-feed.md`
**Branch:** `feat/infinite-scroll-feed`

---

## Context

The home feed loads all posts in a single `useQuery` call, always at page 0. The SQL already supports pagination (`LIMIT 9 OFFSET page * 9`) — but the client never advances past page 0.

**Two problems with the current approach:**

1. **`setseed()` mutates connection state.** Since pgxpool reuses connections, calling `setseed()` changes the random state on a shared connection. Even though each feed query calls its own `setseed()`, mutating shared state is bad practice on a stateless API.

2. **`LIMIT/OFFSET` is O(offset).** PostgreSQL must compute and discard all rows before the offset. Page 50 scans 459 rows just to return 9.

**Solutions:**

1. **md5-based deterministic ordering** — Replace `setseed() + RANDOM()` with `md5(seed || post_id)` converted to a float. Pure function, no connection state mutation. Same deterministic behavior: same seed + same post_id = same score across all pages.

2. **Cursor-based pagination** — Replace `LIMIT/OFFSET` with keyset pagination on the computed score. The server returns a `nextCursor` (score + postId of the last result). Next page: `WHERE score < cursor_score OR (score = cursor_score AND postID > cursor_post_id)`. Constant-time regardless of page depth.

**The score formula:**
```
score = md5_hash_as_float × POW(0.5, age_in_weeks)
```
- `md5_hash_as_float`: first 8 hex chars of `md5(seed || post_id)` → integer → normalized to [0, 1]
- `POW(0.5, age_in_weeks)`: recency decay with 7-day half-life
- Result: newer posts score higher on average, but older posts with lucky hashes still surface — same "alive feed" philosophy

Running `make sqlc` after the SQL change auto-updates `posts.sql.go` and `querier.go`. No manual edits to generated files.

---

## Execution Order

| # | Area | File(s) | Action |
|---|------|---------|--------|
| 1 | DB | `server/internal/db/queries/posts.sql` | CTE with md5 hash + cursor-based WHERE, remove OFFSET |
| 2 | DB | run `make sqlc` | Regenerate — updates GetFeedPostsParams/Row, querier.go comment |
| 3 | Go | `server/internal/posts/service.go` | Add PostsPage, cursor encode/decode, update GetPosts |
| 4 | Go | `server/internal/posts/controller.go` | Pass seed + cursor, return PostsPage |
| 5 | TS | `client/src/features/home/types/sell.post.types.ts` | Add FeedPostsPage (with nextCursor) |
| 6 | TS | `client/src/features/home/hooks/use-feed-query.ts` | New hook (useInfiniteQuery with cursor) |
| 7 | TS | `client/src/features/home/hooks/index.ts` | Export new hook + FEED_QUERY_KEY |
| 8 | TS | `client/src/features/home/components/feed-page.tsx` | Wire infinite scroll + sentinel + indicators |
| 9 | TS | `client/src/features/home/hooks/use-sell-post.ts` | Invalidate feed on post creation |
| 10 | TS | `client/src/routes/_authenticated/_layout/index.tsx` | Remove `page` from search params |

---

## Step 1 — Modify the SQL query

**File:** `server/internal/db/queries/posts.sql`

Replace the existing `GetFeedPosts` query. Key structural changes:
- CTE `scored_posts` computes a deterministic score per post using `md5(seed || post_id)`
- Cursor-based WHERE clause replaces `OFFSET`
- `score` is included in the SELECT list (needed for cursor construction in Go)
- No `setseed()`, no `RANDOM()`, no `OFFSET`

```sql
-- name: GetFeedPosts :many
-- Returns posts ordered by a deterministic recency-biased score.
-- Uses md5(seed || post_id) for deterministic pseudo-random ordering — pure function,
-- no connection state mutation (unlike setseed).
-- Accepts a text seed generated client-side per browsing session.
-- score = md5_hash_as_float × 0.5^(age_in_weeks), half-life = 7 days.
-- Cursor-based pagination: pass cursor_score=0 and cursor_post_id=0 for the first page.
-- For subsequent pages, pass the score and postID of the last post from the previous page.
-- Pass an empty string for category/search to skip those filters.
WITH scored_posts AS (
  SELECT
    u.username        AS "username",
    u.picture         AS "userPicture",
    p.post_id         AS "postID",
    p.user_id         AS "userID",
    p.title,
    p.description,
    p.price,
    p.category,
    p.photo_url       AS "postPhotoURL",
    p.registered_at   AS "registeredAt",
    s.phone_number    AS "phoneNumber",
    s.name            AS "shopName",
    s.description     AS "shopDescription",
    (('x' || substr(md5(sqlc.arg(seed)::text || p.post_id::text), 1, 8))::bit(32)::bigint & 2147483647)::float8 / 2147483647.0
      * POW(0.5, EXTRACT(EPOCH FROM NOW() - p.registered_at) / 604800.0) AS score
  FROM posts p
  LEFT JOIN users u ON u.user_id = p.user_id
  LEFT JOIN shop s ON s.user_id = p.user_id
  WHERE (sqlc.arg(category)::text = '' OR p.category ILIKE sqlc.arg(category)::text)
  AND (
    sqlc.arg(search)::text = ''
    OR p.title       ILIKE '%' || sqlc.arg(search)::text || '%'
    OR p.description ILIKE '%' || sqlc.arg(search)::text || '%'
    OR u.username    ILIKE '%' || sqlc.arg(search)::text || '%'
    OR s.name        ILIKE '%' || sqlc.arg(search)::text || '%'
  )
)
SELECT "username", "userPicture", "postID", "userID", title, description, price, category,
       "postPhotoURL", "registeredAt", "phoneNumber", "shopName", "shopDescription", score
FROM scored_posts
WHERE (sqlc.arg(cursor_score)::float8 = 0 AND sqlc.arg(cursor_post_id)::bigint = 0)
   OR score < sqlc.arg(cursor_score)::float8
   OR (score = sqlc.arg(cursor_score)::float8 AND "postID" > sqlc.arg(cursor_post_id)::bigint)
ORDER BY score DESC, "postID" ASC
LIMIT 9;
```

**Why `cursor_score = 0` is safe as first-page sentinel:** The score formula produces values in (0, 1) × (0, 1] = (0, 1). A score of exactly 0.0 requires the md5 hash to produce `0x00000000` — a 1-in-2-billion chance. Practically impossible.

## Step 2 — Regenerate sqlc

```bash
make sqlc
```

Expected changes in auto-generated files:
- `posts.sql.go` → `GetFeedPostsParams` gains: `Seed string`, `CursorScore float64`, `CursorPostID int64`. Loses: `Page int32`. `GetFeedPostsRow` gains: `Score float64`.
- `querier.go` → Comment for `GetFeedPosts` is auto-updated from the SQL comment.

## Step 3 — Update service

**File:** `server/internal/posts/service.go`

**3a. Add PostsPage type:**
```go
// PostsPage is the paginated response for the feed endpoint.
// HasNextPage is true when the current page is full (9 posts), indicating more may exist.
// NextCursor is an opaque string encoding the last post's score and ID for cursor pagination.
type PostsPage struct {
	Posts       []repo.GetFeedPostsRow `json:"posts"`
	HasNextPage bool                   `json:"hasNextPage"`
	NextCursor  string                 `json:"nextCursor,omitempty"`
}
```

**3b. Add cursor helpers:**
```go
// encodeCursor encodes a score and postID into an opaque cursor string.
func encodeCursor(score float64, postID int64) string {
	return fmt.Sprintf("%.15f:%d", score, postID)
}

// decodeCursor parses an opaque cursor string into score and postID.
// Returns (0, 0, nil) for empty cursor (first page).
//
// Test cases:
// - "" → (0, 0, nil) — first page
// - "0.234567000000000:42" → (0.234567, 42, nil)
// - "invalid" → (0, 0, error)
// - "abc:42" → (0, 0, error)
// - "0.5:abc" → (0, 0, error)
func decodeCursor(cursor string) (float64, int64, error) {
	if cursor == "" {
		return 0, 0, nil
	}
	parts := strings.SplitN(cursor, ":", 2)
	if len(parts) != 2 {
		return 0, 0, fmt.Errorf("invalid cursor format")
	}
	score, err := strconv.ParseFloat(parts[0], 64)
	if err != nil {
		return 0, 0, fmt.Errorf("invalid cursor score: %w", err)
	}
	postID, err := strconv.ParseInt(parts[1], 10, 64)
	if err != nil {
		return 0, 0, fmt.Errorf("invalid cursor post id: %w", err)
	}
	return score, postID, nil
}
```

**3c. Replace GetPostsQueries (remove Page, add Seed + Cursor):**
```go
type GetPostsQueries struct {
	Category string `json:"category" validate:"omitempty"`
	Search   string `json:"search"   validate:"omitempty,max=100"`
	Seed     string `json:"seed"     validate:"omitempty"`    // session seed for deterministic md5 hash
	Cursor   string `json:"cursor"   validate:"omitempty"`    // opaque cursor for pagination
}
```

**3d. Update Service interface:**
```go
GetPosts(ctx context.Context, category, search, seed, cursor string) (PostsPage, error)
```

**3e. Replace GetPosts implementation:**
```go
// GetPosts fetches a deterministically-ordered page of feed posts.
// The seed is used in md5(seed || post_id) inside the SQL CTE to produce a deterministic
// pseudo-random score per post — no setseed(), no connection state mutation.
// Cursor-based pagination: the cursor encodes the last post's score and ID from the
// previous page, enabling constant-time page access regardless of depth.
// HasNextPage is true when exactly 9 results are returned (more pages may exist).
// The cursor is extracted BEFORE ensureCategoryVariety reorders posts, so it correctly
// references the SQL ordering boundary.
//
// Test cases:
// - Same seed, first page (empty cursor) and second page (cursor from first) → no overlapping postIDs
// - Empty cursor → cursor_score=0, cursor_post_id=0 → returns all posts (first page)
// - Invalid cursor → returns error
// - len(posts) < 9 → HasNextPage is false, NextCursor is empty
// - len(posts) == 9 → HasNextPage is true, NextCursor is set
// - Empty category/search → all posts returned without filter applied
func (s *postsService) GetPosts(ctx context.Context, category, search, seed, cursor string) (PostsPage, error) {
	cursorScore, cursorPostID, err := decodeCursor(cursor)
	if err != nil {
		return PostsPage{}, fmt.Errorf("invalid cursor: %w", err)
	}

	posts, err := s.repo.GetFeedPosts(ctx, repo.GetFeedPostsParams{
		Seed:         seed,
		Category:     category,
		Search:       search,
		CursorScore:  cursorScore,
		CursorPostID: cursorPostID,
	})
	if err != nil {
		return PostsPage{}, fmt.Errorf("failed to get posts: %w", err)
	}

	// Build cursor from the SQL-ordered last post BEFORE category reordering
	var nextCursor string
	if len(posts) == 9 {
		last := posts[len(posts)-1]
		nextCursor = encodeCursor(last.Score, last.PostID)
	}

	return PostsPage{
		Posts:       ensureCategoryVariety(posts),
		HasNextPage: len(posts) == 9,
		NextCursor:  nextCursor,
	}, nil
}
```

Add `"strings"` and `"strconv"` to imports. No changes to `NewPostsService`.

## Step 4 — Update controller

**File:** `server/internal/posts/controller.go`

```go
func (c *postsController) GetAllPosts(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	params := r.Context().Value(middleware.QueryCtxKey).(GetPostsQueries)

	postsPage, err := c.service.GetPosts(ctx, params.Category, params.Search, params.Seed, params.Cursor)
	if err != nil {
		log.Println(err)
		utils.WriteResponse(w, http.StatusInternalServerError, nil, utils.ErrInternalServerProblem.Error())
		return
	}

	utils.WriteResponse(w, http.StatusOK, postsPage, "")
}
```

No changes to `server/cmd/api.go`.

---

## Step 5 — Add client type

**File:** `client/src/features/home/types/sell.post.types.ts`

```ts
/** Paginated feed response from GET /posts */
export interface FeedPostsPage {
  posts: FeedPosts[];
  hasNextPage: boolean;
  nextCursor: string;
}
```

## Step 6 — Create useFeedQuery hook

**File:** `client/src/features/home/hooks/use-feed-query.ts` _(new file)_

```ts
/**
 * useFeedQuery — infinite-scroll data source for the home feed.
 *
 * Generates a stable random seed on mount (String(Math.random())) and sends it with
 * every page request. The server uses md5(seed + postId) in the SQL CTE for deterministic
 * pseudo-random ordering — no setseed(), no connection state mutation.
 *
 * Uses cursor-based pagination: the server returns a `nextCursor` string (opaque score:postId),
 * which the client passes back for the next page. No OFFSET — constant-time page access.
 *
 * Changing `category` or `q` resets pagination automatically because both values are
 * part of the TanStack Query key.
 *
 * Test cases:
 * 1. Returns flattened posts array from all loaded pages combined
 * 2. fetchNextPage sends nextCursor from previous page and appends new posts
 * 3. hasNextPage is false when server returns hasNextPage: false (< 9 posts)
 * 4. Changing category or q resets to first page — new queryKey triggers full reset
 * 5. isFetchingNextPage is true while the next page request is in-flight
 * 6. Rapid scroll does not trigger duplicate fetches — TanStack Query deduplicates
 * 7. invalidateQueries([FEED_QUERY_KEY]) resets feed to first page (used after post creation)
 */
```

Internals:
- `const seedRef = useRef(String(Math.random()))` — stable for the component's lifetime
- `useInfiniteQuery` with `queryKey: [FEED_QUERY_KEY, category ?? "", q ?? ""]`
- `queryFn: ({ pageParam }) =>` builds URL params (`seed`, `cursor` if pageParam is not empty, `category`, `search`) and calls `getHttpRequest<FeedPostsPage>`
- `initialPageParam: ""` (empty string = first page, no cursor)
- `getNextPageParam: (lastPage) => lastPage.hasNextPage ? lastPage.nextCursor : undefined`
- Returns `{ posts, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading }` where `posts = data?.pages.flatMap(p => p.posts) ?? []`

## Step 7 — Export from hooks index

**File:** `client/src/features/home/hooks/index.ts`

```ts
export { useFeedQuery, FEED_QUERY_KEY } from "./use-feed-query";
```

## Step 8 — Update FeedPage

**File:** `client/src/features/home/components/feed-page.tsx`

Changes:
- Replace `useGetQuery` with `useFeedQuery({ category, q })`
- Remove `page` from `useSearch` destructuring and URL params build
- Skeleton count: 8 → 9
- Search result count: show `posts.length` (total across all loaded pages)
- Add `sentinelRef` + `useEffect` with `IntersectionObserver` (300px rootMargin) — when sentinel enters view, call `fetchNextPage()` if `hasNextPage && !isFetchingNextPage`
- After post cards: add 3 next-page skeletons when `isFetchingNextPage`
- After post cards: end-of-feed message when `!hasNextPage && posts.length > 0 && !isLoading`
- Sentinel `<div ref={sentinelRef} className="col-span-full h-1" />` as last grid child

Updated JSDoc test cases:
```
 * Test cases:
 * 1. Shows 9 skeleton loaders while the initial page is being fetched
 * 2. Renders a SellPostCard for each post once data loads
 * 3. Appends 3 skeleton loaders at the bottom while the next page loads
 * 4. Shows end-of-feed message when hasNextPage is false and posts exist
 * 5. Shows empty state when posts array is empty (no results for search/category)
 * 6. Passes the active category search param down to FeedCategoryFilter
```

## Step 9 — Invalidate feed on post creation

**File:** `client/src/features/home/hooks/use-sell-post.ts`

After successful mutation, reset feed so the new post (high recency score) surfaces:
```ts
queryClient.invalidateQueries({ queryKey: [FEED_QUERY_KEY] });
```
Import `FEED_QUERY_KEY` from the hooks index.

## Step 10 — Clean up router search params

**File:** `client/src/routes/_authenticated/_layout/index.tsx`

Remove `page` from `homeParamsSchema` and `HomeParams`. Pagination is now internal to `useInfiniteQuery`.

---

## Verification

1. **API:** `GET /posts?seed=0.42` → `{ data: { posts: [...9 items], hasNextPage: true, nextCursor: "0.234:42" } }`. Same seed with `cursor=0.234:42` → no shared `postID` values with first page.
2. **Initial load:** Open `/` → exactly 9 post cards, no "Load More" button.
3. **Infinite scroll:** Scroll to bottom → 3 skeleton cards appear, then 9 more posts append.
4. **End of feed:** All posts loaded → "Ya viste todo por ahora 🎉" appears; no more fetches fire.
5. **Category filter:** Click a category → feed resets to 9 filtered posts, scroll loads more.
6. **Search:** Type in navbar → feed resets to filtered results, infinite scroll works from first page.
7. **Post creation:** Publish a post → feed invalidates and reloads with new post near the top.
8. **Edge case:** < 9 total posts → `hasNextPage: false` on first load → end-of-feed shows immediately.
9. **No pool contamination:** No `setseed()` calls — md5 is a pure function, no connection state mutation.
10. **Cursor performance:** Page 50 is as fast as page 0 — no OFFSET scanning.
