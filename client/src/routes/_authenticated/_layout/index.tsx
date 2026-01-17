import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  createFileRoute,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import {
  ArrowRight,
  Gem,
  Handbag,
  Heart,
  House,
  Shirt,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Store,
  TvMinimal,
} from "lucide-react";

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

  const postOwner = "Marco poloccinni";

  // TODO: we need to finish this

  return (
    <section className="w-[90%] m-auto pb-10">
      {/* Categories */}
      <div className="w-full mt-10 flex gap-x-2">
        <Button
          size={"lg"}
          variant={"outline"}
          className={cn(
            "cursor-pointer hover:scale-105 hover:text-violet-400 transition-all hover:border hover:border-primary/70 px-5 hover:bg-input/40",
            {
              "text-violet-400 border-primary hover:text-violet-400 hover:border-primary hover:bg-input/30":
                category && category === "todo",
            }
          )}
          onClick={() => navigate({ to: "/", search: { category: "todo" } })}
        >
          <Sparkles />
          Todo
        </Button>
        <Button
          size={"lg"}
          variant={"outline"}
          className={
            "cursor-pointer hover:scale-105 hover:text-primary transition-all hover:border hover:border-primary/70 px-5 hover:bg-input/40"
          }
        >
          <TvMinimal />
          Streaming
        </Button>
        <Button
          size={"lg"}
          variant={"outline"}
          className={
            "cursor-pointer hover:scale-105 hover:text-primary transition-all hover:border hover:border-primary/70 px-5 hover:bg-input/40"
          }
        >
          <Smartphone />
          Electrónicos
        </Button>
        <Button
          size={"lg"}
          variant={"outline"}
          className={
            "cursor-pointer hover:scale-105 hover:text-primary transition-all hover:border hover:border-primary/70 px-5 hover:bg-input/40"
          }
        >
          <Shirt />
          Ropa
        </Button>
        <Button
          size={"lg"}
          variant={"outline"}
          className={
            "cursor-pointer hover:scale-105 hover:text-primary transition-all hover:border hover:border-primary/70 px-5 hover:bg-input/40"
          }
        >
          <Gem />
          Accesorios
        </Button>
        <Button
          size={"lg"}
          variant={"outline"}
          className={
            "cursor-pointer hover:scale-105 hover:text-primary transition-all hover:border hover:border-primary/70 px-5 hover:bg-input/40"
          }
        >
          <House />
          Casa
        </Button>
        <Button
          size={"lg"}
          variant={"outline"}
          className={
            "cursor-pointer hover:scale-105 hover:text-primary transition-all hover:border hover:border-primary/70 px-5 hover:bg-input/40"
          }
        >
          <Handbag />
          Otros
        </Button>
      </div>
      {/* Feed */}
      <div className="w-full mt-10 flex flex-col">
        <h2 className="text-2xl font-semibold tracking-tight">
          Lo más Nuevo 🔥
        </h2>

        <div className="w-full mt-5 grid grid-cols-4 gap-x-5">
          {/* Posts */}
          <div className="rounded-3xl relative group border border-border/50 overflow-hidden hover:border-primary/50 transition-all duration-200 animate-in hover:shadow-[0px_0px_5px] hover:shadow-primary/30 bg-linear-to-br from-violet-900/40 to-fuchsia-900/30 via-purple-900/40 h-167.5">
            {/* Image */}
            <div className="relative h-80 overflow-hidden cursor-pointer">
              <img
                className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                src={
                  "https://images.unsplash.com/photo-1611162617474-5b21e879e113"
                }
              />

              {/* Like button */}
              <div className="absolute top-3 right-3 flex gap-2">
                <Button
                  size={"icon-sm"}
                  variant={"secondary"}
                  className={
                    "cursor-pointer hover:scale-105 transition-all active:scale-100 shadow-[0px_0px_12px] shadow-black/40 border border-white/30"
                  }
                >
                  <Heart />
                </Button>
              </div>
            </div>
            {/* Information */}
            <div className="p-5 space-y-4">
              {/* Categories */}
              <Badge variant={"outline"} className="p-3">
                Streaming <TvMinimal />
              </Badge>
              {/* Title */}
              <p className="font-semibold truncate">🍿🎬 STREAMING 🎬🍿</p>
              {/* Description */}
              <span className="text-xs text-muted-foreground truncate block">
                NETFLIX EXTRA 15,000
                <br />
                NETFLIX ORIGINAL 10,000
                <br />
                NETFLIX INTERNACIONAL 11,000 <br />
                DISNEY STANDAR 8,000 <br />
                DISNEY PREMIUM 10,000 <br />
                ...
                <span className="text-fuchsia-400/80 flex items-center gap-x-2 cursor-pointer">
                  Ver más
                  <ArrowRight className="size-4" />
                </span>
              </span>
              {/* Price */}
              <div className="w-full flex justify-between items-center">
                <span className="text-fuchsia-400 text-lg font-semibold">
                  $30.000
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
              <div className="w-full flex items-center justify-between cursor-pointer gap-x-2">
                <div className="flex items-center gap-x-2">
                  {/* Owner phot */}
                  <Avatar>
                    <AvatarImage src={"https://i.pravatar.mcc/100?img=11"} />
                    <AvatarFallback className="bg-primary/50 text-white">
                      {postOwner[0]}
                    </AvatarFallback>
                  </Avatar>
                  {/* Owner name */}
                  <span className="text-sm">Alejandro P</span>
                </div>
                <Store className="text-purple-400 size-4" />
              </div>
            </div>
          </div>
        </div>
        {/* TODO: Footer */}
      </div>
    </section>
  );
}
