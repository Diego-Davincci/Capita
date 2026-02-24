import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { FeedPosts } from "@/features/home/types";
import { formatPrice, homeCategories } from "@/features/home/utils";
import { useGetQuery } from "@/hooks";
import { API_URL, cn } from "@/lib/utils";
import {
  createFileRoute,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import { Heart, ShoppingBag, Store } from "lucide-react";

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
  const navigate = useNavigate();

  // TODO: add category
  const { data, isLoading } = useGetQuery<FeedPosts[]>({
    queryKey: [`feed-category`],
    url: `${API_URL}/posts`,
  });

  /* TODO: Finish responsive + design + make HTTP call for posts
  QA Tests:
  1. Loading state, shows skeletons ✅
  2. http call error 5xx ✅
  3. data is empty (don't show nothing) ✅
  4. show data smoothly ✅
  */

  /* TODO: 
  1. add a modal view to see the whole post info
  2. if post owner username is larger than 35 characters, show tooltip

  */

  return (
    <section className="w-[90%] m-auto pb-10 max-w-7xl overflow-hidden p-2">
      {/* Categories */}
      <div className="w-full mt-10 flex gap-x-2 flex-wrap gap-y-2 justify-center sm:justify-start">
        {homeCategories.map(({ name, Icon }) => (
          <Button
            key={name}
            size={"lg"}
            variant={"outline"}
            className={cn(
              "cursor-pointer hover:scale-105 hover:text-violet-400 transition-all hover:border hover:border-primary/70 px-5 hover:bg-input/40",
              {
                "text-violet-400 border-primary hover:text-violet-400 hover:border-primary hover:bg-input/30":
                  category && category === name.toLowerCase(),
              },
            )}
            onClick={() =>
              navigate({ to: "/", search: { category: name.toLowerCase() } })
            }
          >
            <Icon />
            {name}
          </Button>
        ))}
      </div>
      {/* Feed */}
      <div className="w-full mt-10 flex flex-col">
        <h2 className="text-2xl font-semibold tracking-tight">
          Lo más Nuevo 🔥
        </h2>

        <div className="w-full mt-5 grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {/* Posts */}
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
                data.map(
                  ({
                    postID,
                    postPhotoURL,
                    category,
                    title,
                    description,
                    price,
                    username,
                    userPicture,
                  }) => {
                    const CategoryIcon = homeCategories.find(
                      (c) => c.name === category,
                    )!.Icon;

                    return (
                      <div
                        className="rounded-3xl relative group border border-border/50 overflow-hidden hover:border-primary/50 transition-all duration-200 animate-in hover:shadow-[0px_0px_15px] hover:shadow-primary/40 bg-linear-to-br from-violet-900/40 to-fuchsia-900/30 via-purple-900/40 h-158.5"
                        key={postID}
                      >
                        {/* Image */}
                        <div className="relative h-80 overflow-hidden">
                          <img
                            className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                            src={postPhotoURL}
                          />

                          {/* Like button */}
                          <div className="absolute top-3 right-3 flex gap-2">
                            <Button
                              size={"icon-sm"}
                              variant={"secondary"}
                              className={
                                "cursor-pointer hover:scale-105 transition-all active:scale-100 shadow-[0px_0px_15px] shadow-black/70 border border-white/40"
                              }
                            >
                              <Heart />
                            </Button>
                          </div>
                        </div>
                        {/* Information */}
                        <div className="px-5 py-3 flex flex-col justify-between gap-y-2 h-78">
                          {/* Categories */}
                          <Badge variant={"outline"} className="p-3">
                            {category} <CategoryIcon />
                          </Badge>
                          {/* Title */}
                          <div className="max-h-14 overflow-hidden">
                            <p className="font-semibold line-clamp-2">
                              {title}
                            </p>
                          </div>
                          {/* Description */}
                          <p className="text-[13px] text-muted-foreground truncate block h-24 overflow-y-scroll">
                            {description ? (
                              description.split("\n").map((d, i) => (
                                <span key={d + i}>
                                  {d}
                                  <br />
                                </span>
                              ))
                            ) : (
                              <span>Sin Descripción.</span>
                            )}
                          </p>
                          {/* Price */}
                          <div className="w-full flex justify-between items-center mt-2">
                            <span className="text-fuchsia-400 text-lg font-semibold">
                              ${formatPrice(price)}
                            </span>
                            <Button
                              className={
                                "cursor-pointer transition-all hover:scale-[1.05] active:scale-100"
                              }
                            >
                              <ShoppingBag />
                              Comprar
                            </Button>
                          </div>
                          <Separator />
                          {/* Post Owner Info */}
                          <div className="w-full flex items-end justify-between gap-x-5 overflow-hidden">
                            <div className="flex items-center gap-x-2 w-4/5">
                              {/* Owner's photo */}
                              <Avatar>
                                <AvatarImage src={userPicture} />
                                <AvatarFallback className="bg-primary/50 text-white">
                                  {username[0]}
                                </AvatarFallback>
                              </Avatar>
                              {/* Owner's name */}
                              {username.length >= 35 ? (
                                <Tooltip>
                                  <TooltipTrigger
                                    delay={0}
                                    className={"truncate text-sm"}
                                  >
                                    {username}
                                  </TooltipTrigger>
                                  <TooltipContent>{username}</TooltipContent>
                                </Tooltip>
                              ) : (
                                <span>{username}</span>
                              )}
                            </div>
                            {/* <div className="shrink-0">
                              <Tooltip>
                                <TooltipTrigger delay={0}>
                                  <Store className="text-purple-400 size-4" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  Esto es un Emprendimiento !
                                </TooltipContent>
                              </Tooltip>
                            </div> */}
                          </div>
                        </div>
                      </div>
                    );
                  },
                )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
