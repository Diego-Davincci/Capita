import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  createFileRoute,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import {
  Gem,
  Handbag,
  House,
  Shirt,
  Smartphone,
  Sparkles,
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

  return (
    <section className="w-[90%] m-auto max-w-7xl">
      {/* Categories */}
      <div className="w-full mt-10 flex gap-x-2">
        <Button
          size={"lg"}
          variant={"outline"}
          className={cn(
            "cursor-pointer hover:scale-105 hover:text-primary transition-all hover:border hover:border-primary/70 px-5 hover:bg-input/40",
            {
              "text-primary border-primary hover:text-primary hover:border-primary hover:bg-input/30":
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

        <div className="w-full mt-2 grid grid-cols-4">
          {/* Posts */}
          <div className="rounded-2xl"></div>
        </div>
        {/* Footer */}
      </div>
    </section>
  );
}
