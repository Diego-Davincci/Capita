import { useEffect, useRef } from "react";
import { useSearch } from "@tanstack/react-router";

import { Skeleton } from "@/components/ui/skeleton";
import { FeedCategoryFilter } from "./feed-category-filter";
import { SellPostCard } from "./sell-post-card";
import { useFeedQuery } from "../hooks";
import { SearchX } from "lucide-react";

/**
 * FeedPage — main home/feed view with cursor-based infinite scroll.
 * Fetches posts in pages of 9, appending as the user scrolls near the bottom.
 *
 * Test cases:
 * 1. Shows 9 skeleton loaders while the initial page is being fetched
 * 2. Renders a SellPostCard for each post once data loads
 * 3. Appends 3 skeleton loaders at the bottom while the next page loads
 * 4. Shows end-of-feed message when hasNextPage is false and posts exist
 * 5. Shows empty state when posts array is empty (no results for search/category)
 * 6. Passes the active category search param down to FeedCategoryFilter
 */
export const FeedPage = () => {
  const { category, q } = useSearch({ from: "/_authenticated/_layout/" });
  const sentinelRef = useRef<HTMLDivElement>(null);

  const { posts, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useFeedQuery({ category, q });

  // IntersectionObserver to trigger next page fetch when sentinel enters viewport
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "100px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const hasResults = posts && posts.length > 0;

  return (
    <section className="w-[90%] m-auto pb-10 max-w-7xl overflow-hidden p-2">
      <FeedCategoryFilter activeCategory={category} />

      {/* Feed */}
      <div className="w-full mt-10 flex flex-col">
        <h2 className="text-2xl font-semibold tracking-tight flex flex-col">
          {q ? (
            <>
              Resultados para "{q}"
              <span className="text-muted-foreground text-sm font-normal tracking-normal">
                {posts.length} productos encontrados
              </span>
            </>
          ) : (
            "Lo más Nuevo 🔥"
          )}
        </h2>

        <div className="w-full mt-5 grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            <>
              {Array.from({ length: 9 }).map((_, i) => (
                <Skeleton
                  className="h-137.5 rounded-3xl bg-purple-500/30"
                  key={i}
                />
              ))}
            </>
          ) : hasResults ? (
            <>
              {posts.map((post) => (
                <SellPostCard key={post.postID} sellPost={post} />
              ))}

              {/* Next page loading skeletons */}
              {isFetchingNextPage &&
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton
                    className="h-137.5 rounded-3xl bg-purple-500/30"
                    key={`next-${i}`}
                  />
                ))}

              {/* End of feed */}
              {!hasNextPage && !isLoading && (
                <p className="col-span-full text-center text-muted-foreground py-8">
                  Ya viste todo por ahora 😎
                </p>
              )}

              {/* Scroll sentinel */}
              <div ref={sentinelRef} className="col-span-full h-1" />
            </>
          ) : q || category ? (
            <div className="col-span-full flex justify-center items-center flex-col gap-y-2 my-10">
              <div className="size-24 rounded-full border flex items-center justify-center border-primary/40 bg-violet-500/20">
                <SearchX className="size-10 text-violet-300" />
              </div>
              <p className="font-semibold text-lg">
                No encontramos posts con tu búsqueda 😢
              </p>
              <span className="w-1/2 text-muted-foreground text-center">
                Intentá con otras palabras claves ! puedes incluir el nombre de
                la tienda, tipo de productos, descripciones y demás
              </span>
            </div>
          ) : (
            <div className="col-span-full flex justify-center items-center flex-col gap-y-2 my-10">
              <span className="text-muted-foreground">
                No hay posts actualmente 😭
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
