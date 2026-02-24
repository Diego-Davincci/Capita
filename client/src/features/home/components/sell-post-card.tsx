import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, ShoppingBag, Store } from "lucide-react";
import { formatPrice } from "../utils";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { FeedPosts } from "../types";

type Props = {
  sellPost: FeedPosts;
};

export const SellPostCard = ({ sellPost: { postID, postPhotoURL } }: Props) => {
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
          <p className="font-semibold line-clamp-2">{title}</p>
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
        <div className="w-full flex items-center justify-between gap-x-5 overflow-hidden">
          <div className="flex items-center gap-x-2 w-4/5">
            {/* Owner's photo */}
            <Avatar>
              <AvatarImage src={userPicture} />
              <AvatarFallback className="bg-primary/50 text-white">
                {username[0]}
              </AvatarFallback>
            </Avatar>
            {/* Owner's name */}
            <Tooltip>
              <TooltipTrigger delay={0} className={"truncate text-sm"}>
                {username}
              </TooltipTrigger>
              <TooltipContent>{username}</TooltipContent>
            </Tooltip>
          </div>
          <div className="shrink-0">
            <Tooltip>
              <TooltipTrigger delay={0}>
                <Store className="text-purple-400 size-4" />
              </TooltipTrigger>
              <TooltipContent>Esto es un Emprendimiento !</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  );
};
