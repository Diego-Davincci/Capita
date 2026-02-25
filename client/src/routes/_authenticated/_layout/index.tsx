import { Skeleton } from "@/components/ui/skeleton";
import { FeedCategoryFilter, SellPostCard } from "@/features/home/components";
import type { FeedPosts } from "@/features/home/types";
import { useGetQuery } from "@/hooks";
import { API_URL } from "@/lib/utils";
import {
  createFileRoute,
  useSearch,
} from "@tanstack/react-router";

type HomeParams = {
  category?: string;
};

export const Route = createFileRoute("/_authenticated/_layout/")({
  component: RouteComponent,
  validateSearch: (search: HomeParams): HomeParams => {
    return {
      category: search?.category as string | undefined,
    };
  },
});

function RouteComponent() {
  const { category } = useSearch({ from: "/_authenticated/_layout/" });

  // TODO: pass category as query param to filter by category
  const { data, isLoading } = useGetQuery<FeedPosts[]>({
    queryKey: [`feed-category`],
    url: `${API_URL}/posts`,
  });

  return (
    <section className="w-[90%] m-auto pb-10 max-w-7xl overflow-hidden p-2">
      <FeedCategoryFilter activeCategory={category} />

      {/* Feed */}
      <div className="w-full mt-10 flex flex-col">
        <h2 className="text-2xl font-semibold tracking-tight">
          Lo más Nuevo 🔥
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
          ) : (
            <>
              {data &&
                data.length > 0 &&
                data.map((post) => (
                  <SellPostCard key={post.postID} sellPost={post} />
                ))}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
