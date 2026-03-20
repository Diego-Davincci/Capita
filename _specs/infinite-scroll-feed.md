# Spec for Infinite Scroll Feed

## Summary

Replace the current single-batch feed (hard-coded 20 posts) with cursor-based infinite scroll pagination, loading 9 posts per page. As the user scrolls near the bottom of the feed, the next page loads automatically — no "Load More" button. Optionally integrate list virtualization (e.g. TanStack Virtual) to keep DOM node count low and maintain smooth performance as hundreds of posts accumulate.

The server currently orders posts by a recency-biased random score (`RANDOM() * POW(0.5, ...)`). Because this score is non-deterministic, traditional offset pagination would produce duplicates/gaps between pages. The solution uses **keyset (cursor) pagination**: on the first request the server generates the randomized ranking, assigns each row a deterministic position, and returns a cursor (the last row's position) that the client passes back to fetch the next slice.

## Functional Requirements

- The feed loads an initial batch of 9 posts on page mount.
- When the user scrolls within a threshold of the bottom (e.g. 300px), the next 9 posts are fetched automatically.
- A lightweight loading indicator (spinner or skeleton row) appears at the bottom while the next page is being fetched.
- When there are no more posts to load, the infinite scroll stops triggering and a subtle end-of-feed indicator is shown.
- Existing category filtering (`?category=`) continues to work — changing the category resets the feed to page 1.
- The feed preserves scroll position when the user navigates back from a post detail or modal.
- The server exposes cursor-based pagination parameters: `limit` (default 9) and `cursor` (opaque string, omitted on first request).
- The `ensureCategoryVariety()` reordering logic in the service layer continues to apply within each page.

## Virtualization (Optional Enhancement)

- If adopting TanStack Virtual (already in the TanStack ecosystem the project uses), only the visible post cards plus a small overscan buffer are rendered in the DOM.
- This keeps DOM node count constant regardless of how many pages have been loaded.
- Virtualization should be pursued only if it integrates cleanly with the existing responsive grid layout (1 / 2 / 3 columns). If the implementation becomes overly complex (e.g. requiring manual measurement of variable-height rows across breakpoints), skip it and rely on the browser's native rendering — 9 posts per page is small enough that performance should remain acceptable without virtualization for typical session depths.

## Possible Edge Cases

- The randomized ranking means the same query can return different orderings across requests. The cursor must encode enough state to produce a stable sequence across pages within a single browsing session.
- If new posts are published while the user is scrolling, they will not appear in the current session's feed (the ranking was fixed on the first request). This is acceptable — a pull-to-refresh or page reload picks them up.
- If posts are deleted between page fetches, the cursor should gracefully skip missing rows rather than erroring.
- A user with very fast scrolling could trigger multiple concurrent fetches — TanStack Query's `useInfiniteQuery` deduplicates these naturally.
- Empty feed (zero posts) should still show a friendly empty state, not an infinite loading spinner.
- Category change while a page is mid-fetch should cancel the in-flight request and reset.

## Acceptance Criteria

- On first load, exactly 9 posts are rendered (or fewer if the total is < 9).
- Scrolling near the bottom triggers the next page fetch without user interaction.
- No duplicate posts appear across pages within a single session.
- Category filter resets pagination and fetches a fresh first page.
- The loading indicator is visible only while a page is actively being fetched.
- The feed stops fetching when the server signals no more results (e.g. returns fewer than 9 posts or an explicit `hasNextPage: false`).
- The server's `GET /posts` endpoint accepts `limit` and `cursor` query parameters and returns a `nextCursor` field alongside the posts array.
- Performance: scrolling remains smooth with 50+ posts loaded (no jank or layout thrashing).

## Open Questions

- **Cursor strategy:** Should the server use a DB-level approach (e.g. a session-scoped materialized ranking table or a seed-based `RANDOM(seed)`) vs. encoding the ranking in-memory? DB-level is more robust but adds complexity. A `setseed()`-based approach in PostgreSQL could make `RANDOM()` deterministic per session without extra tables.
- **Virtualization decision:** Should we commit to TanStack Virtual now or defer it until performance profiling shows it's needed? Given fixed-height cards and 9-per-page batches, virtualization may be premature.
- **Page size:** 9 is proposed to fill a 3-column grid evenly. Should this be configurable or is 9 the final number?
