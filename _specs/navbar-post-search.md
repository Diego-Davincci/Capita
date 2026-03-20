# Spec for Navbar Post Search

## Summary

Add a search input to the home page navbar that allows users to filter posts in real time by keyword. The input uses debouncing to minimize API calls, and results update the existing posts feed without a full page reload.

## Functional Requirements

- A search input is visible in the navbar on the home page (`/`).
- Users can type a keyword and the posts feed filters automatically after a debounce delay (suggested: 400–600ms).
- Search matches against: post `title`, `description`, `category`, post owner username, and associated shop name (if applicable).
- When the search input is empty the feed returns to its default state (full unfiltered list).
- The search is case-insensitive.
- The current category filter (if any) should remain compatible/composable with the search query.
- A loading indicator is shown while the debounced request is in flight.
- If no posts match the search, an empty state message is displayed (e.g. "No posts found for "…"").
- Search query must be added to the URL so it persists reloading the page.

## Possible Edge Cases

- User types and clears the input very quickly — only one API call should fire after the debounce settles, not one per keystroke.
- User navigates away while a debounced request is pending — the in-flight request should be cancelled/ignored.
- Search term contains special characters or whitespace — should be safely encoded before being sent as a query parameter.
- Very long search strings — we should limit the amount of characters to the user, it should allow a good amount of characters but not too exaggerated.
- Slow network / server response: if a newer search query resolves before an older one, only the most recent response should be rendered (race condition handling).
- Search input should be accessible: keyboard focusable, labelled for screen readers, supports clearing via Escape key.

## Acceptance Criteria

- Typing in the navbar search input filters the posts feed without a full page navigation.
- API calls are debounced — no more than one request fires per debounce window per continuous typing session.
- An empty search input restores the full, unfiltered feed.
- The search works in combination with any existing category filter.
- An empty state is displayed when no results match.
- A loading state is shown while the search request is in progress.
- The feature is fully responsive across mobile, tablet, and desktop viewports.
- The search input is keyboard-accessible and has an appropriate ARIA label.

## Open Questions

- Should search results be paginated in the same way as the normal feed, or return a flat list? Yes we should pagginate, like 9 posts per batch.
- Should search history or suggestions (autocomplete) be considered for a future iteration? Not yet.
- Is "shop associated" search in scope for the first version, or deferred until shops are fully implemented? Yes implement shop properties.
- Should the search query be reflected in the URL (e.g. `/?q=keyword`) to support shareable/bookmarkable searches? Yes.
- What is the desired debounce delay — 400ms, 500ms, or another value agreed on by the team? Let's do 400ms.
