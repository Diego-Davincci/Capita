import { useLocation, useNavigate, useSearch } from "@tanstack/react-router";

import { useStore } from "@/store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Highlighter } from "@/components/ui/highlighter";
import { Input } from "@/components/ui/input";
import { Search, Store } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { SellPostModal } from "@/features/home/components";
import { useDebounce } from "@/hooks";

export const Navbar = () => {
  const location = useLocation();
  const { q } = useSearch({ strict: false });
  const navigate = useNavigate();
  const user = useStore((store) => store.user);

  const pathNotHome = location.pathname !== "/";

  const [highlightAnimation, setHighlightAnimation] = useState<boolean>(false);
  useEffect(() => {
    setHighlightAnimation(true);
  }, []);

  const [open, setOpen] = useState<boolean>(false);

  // TODO: responsive navbar

  // Search input state
  const [inputValue, setInputValue] = useState(q ?? "");
  const debouncedSearch = useDebounce<string>(inputValue, 400);

  // Sync URL -> local state when user navigates back and forward
  useEffect(() => {
    setInputValue(q ?? "");
  }, [q]);

  // When debounced value settles, update URL
  useEffect(() => {
    // Only navigate if we're on home or the user is actively typing
    if (!pathNotHome) {
      navigate({
        to: "/",
        search: (prev) => ({
          ...prev,
          q: debouncedSearch || undefined,
          page: undefined, // reset pagination on new search
        }),
      });
    }
  }, [debouncedSearch, navigate, pathNotHome]);

  return (
    <header className="w-[95%] m-auto border sticky top-2 left-0 right-0 border-violet-500/20 h-17.5 bg-[#1a0b2e]/80 backdrop-blur-xl z-50 rounded-3xl max-w-7xl">
      {/* Main Navigation */}
      <nav className="w-full h-full flex py-4 sm:px-10 px-5 justify-between items-center m-auto gap-x-5">
        {/* Left */}
        <div
          className="flex items-center justify-center gap-x-2 cursor-pointer"
          onClick={() => navigate({ to: "/", search: (prev) => ({ ...prev }) })}
        >
          <div className="w-10 h-10 rounded-lg bg-linear-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/50">
            <Store className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight hidden sm:block">
            <Highlighter
              action="underline"
              color="#8e51ff"
              iterations={1}
              multiline={true}
              padding={0.5}
              isView={highlightAnimation}
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
              disabled={pathNotHome}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              maxLength={100}
              aria-label="Buscar publicaciones"
            />
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-x-3">
          <Button
            size={"lg"}
            className={
              "bg-linear-to-br from-primary to-fuchsia-500 cursor-pointer font-semibold text-base hover:scale-[1.05] transition-all active:scale-100"
            }
            onClick={() => setOpen(true)}
          >
            🤑
            <span className="hidden lg:block">Vender</span>
          </Button>

          <div onClick={() => navigate({ to: "/profile" })}>
            <Avatar className="cursor-pointer size-10 hover:scale-110 transition-all active:scale-100">
              <AvatarImage
                src={user.picture}
                alt="User Img"
                referrerPolicy="no-referrer"
              />
              <AvatarFallback className="bg-violet-500 text-white">
                {user.username[0]}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </nav>
      <SellPostModal open={open} setOpen={setOpen} />
    </header>
  );
};
