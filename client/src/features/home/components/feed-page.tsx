import { useSearch } from "@tanstack/react-router";

import { Skeleton } from "@/components/ui/skeleton";
import { useGetQuery } from "@/hooks";
import { API_URL } from "@/lib/utils";
import { FeedCategoryFilter } from "./feed-category-filter";
import { SellPostCard } from "./sell-post-card";
import type { FeedPosts } from "../types";
import { SearchX } from "lucide-react";

/**
 * FeedPage — main home/feed view.
 * Fetches all posts and renders them in a responsive grid with category filtering.
 *
 * Test cases:
 * 1. Shows skeleton loaders while posts are being fetched
 * 2. Renders SellPostCard for each post once data loads
 * 3. Renders nothing inside the grid when the posts array is empty
 * 4. Passes the active category search param down to FeedCategoryFilter
 */
export const FeedPage = () => {
  const { category, q, page } = useSearch({ from: "/_authenticated/_layout/" });

  /* 
  TODO:
  1. how to properly organize query keys in the entire codebase
  2. react compiler ?
  */

  // Build API URL with query params
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (q) params.set("search", q);
  if (page) params.set("page", String(page));
  const queryString = params.toString();
  const url = `${API_URL}/posts${queryString ? `?${queryString}` : ""}`;

  // TODO: pass category as query param to filter by category
  const { data, isLoading } = useGetQuery<FeedPosts[]>({
    queryKey: [`feed-category-category=${category}-q=${q}-page-${page}`],
    url,
  });

  const hasResults = data && data.length > 0;

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
                {data ? data.length : 0} productos encontrados
              </span>
            </>
          ) : (
            "Lo más Nuevo 🔥"
          )}
        </h2>

        <div className="w-full mt-5 grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            <>
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton
                  className="h-137.5 rounded-3xl bg-purple-500/30"
                  key={i}
                />
              ))}
            </>
          ) : hasResults ? (
            <>
              {data &&
                data.length > 0 &&
                data.map((post) => (
                  <SellPostCard key={post.postID} sellPost={post} />
                ))}
            </>
          ) : (
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
          )}
        </div>
      </div>
    </section>
  );
};
