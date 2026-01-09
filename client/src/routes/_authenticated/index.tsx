import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Highlighter } from "@/components/ui/highlighter";
import { Input } from "@/components/ui/input";
import { useStore } from "@/store";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Search, Store } from "lucide-react";

export const Route = createFileRoute("/_authenticated/")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();

  const user = useStore((store) => store.user);

  const username = "Daniela Migajos";

  // TODO: separate navbar into its own component

  return (
    <main className="w-full min-h-screen bg-linear-to-b from-[#1a0b2e] to-[#2f1651]">
      {/* Navbar */}
      <header className="w-full border-b sticky top-0 left-0 right-0 border-violet-500/20 h-17.5 bg-[#1a0b2e] backdrop-blur-xl">
        {/* Main Navigation */}
        <nav className="w-full h-full flex py-4 sm:px-20 px-5 justify-between items-center max-w-7xl m-auto">
          {/* Left */}
          <div
            className="flex items-center justify-center gap-x-2 cursor-pointer"
            onClick={() => navigate({ to: "/" })}
          >
            <div className="w-10 h-10 rounded-lg bg-linear-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/50">
              <Store className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight hidden sm:block">
              <Highlighter
                action="underline"
                color="#8e51ff"
                iterations={1}
                padding={0.5}
              >
                Cápita
              </Highlighter>
            </h1>
          </div>

          {/* Center */}
          <div className="w-3/5">
            <div className="relative">
              <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 left-4" />
              <Input
                className="border-primary/70 pl-10 hover:shadow-md hover:shadow-primary/40 transition-all focus:border-primary/50! focus:ring-primary/50!"
                placeholder="Busca subcripciones de streaming, auriculares, productos..."
              />
            </div>
          </div>

          {/* Right */}
          <div>
            <Avatar className="cursor-pointer size-9 hover:scale-110 transition-all active:scale-100">
              <AvatarImage src="https://github.com/shadcn.png" alt="User Img" />
              <AvatarFallback className="bg-violet-500 text-white">
                {username[0]}
              </AvatarFallback>
            </Avatar>
          </div>
        </nav>
      </header>
    </main>
  );
}
