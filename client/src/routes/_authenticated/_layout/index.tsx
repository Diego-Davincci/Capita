import { createFileRoute } from "@tanstack/react-router";
import { FeedPage } from "@/features/home/components";

type HomeParams = {
  category?: string;
};

export const Route = createFileRoute("/_authenticated/_layout/")({
  component: FeedPage,
  validateSearch: (search: HomeParams): HomeParams => {
    return {
      category: search?.category as string | undefined,
    };
  },
});
