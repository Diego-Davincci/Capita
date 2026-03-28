import { createFileRoute } from "@tanstack/react-router";
import { FeedPage } from "@/features/home/components";
import z from "zod";

const homeParamsSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
});

type HomeParams = z.infer<typeof homeParamsSchema>;

export const Route = createFileRoute("/_authenticated/_layout/")({
  component: FeedPage,
  validateSearch: (search: HomeParams): HomeParams =>
    homeParamsSchema.parse(search),
});
