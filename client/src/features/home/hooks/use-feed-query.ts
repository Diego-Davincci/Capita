import { useRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { getHttpRequest } from "@/lib/api/client";
import { API_URL } from "@/lib/utils";
import type { FeedPostsPage } from "../types";

export const FEED_QUERY_KEY = "feed";

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
export const useFeedQuery = ({
  category,
  q,
}: {
  category?: string;
  q?: string;
}) => {
  const seedRef = useRef(String(Math.random()));
  // Snapshot the current time once per session so the decay factor in the score formula
  // is stable across all page requests — prevents cursor boundary drift between pages.
  const sessionTimeRef = useRef(Date.now() / 1000);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey: [FEED_QUERY_KEY, category ?? "", q ?? ""],
      queryFn: async ({ pageParam }) => {
        const params = new URLSearchParams();
        params.set("seed", seedRef.current);
        params.set("sessionTime", String(sessionTimeRef.current));
        if (pageParam) params.set("cursor", pageParam);
        if (category) params.set("category", category);
        if (q) params.set("search", q);

        const url = `${API_URL}/posts?${params.toString()}`;
        return getHttpRequest<FeedPostsPage>(url);
      },
      initialPageParam: "",
      getNextPageParam: (lastPage) =>
        lastPage.hasNextPage ? lastPage.nextCursor : undefined,
    });

  const posts =
    data?.pages && data.pages[0].posts
      ? data?.pages.flatMap((p) => p.posts)
      : [];

  return { posts, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading };
};
