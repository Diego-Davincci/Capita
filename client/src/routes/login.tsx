import { Button } from "@/components/ui/button";
import { Highlighter } from "@/components/ui/highlighter";
import { API_URL } from "@/lib/utils";
import { createFileRoute, redirect, useSearch } from "@tanstack/react-router";
import { Store } from "lucide-react";

type LoginParams = {
  err?: string;
};

export const Route = createFileRoute("/login")({
  component: RouteComponent,
  beforeLoad: async ({ context }) => {
    if (context.isAuthorized) {
      throw redirect({ to: "/" });
    }
  },
  validateSearch: (search: Record<string, string>): LoginParams => {
    return {
      err: search?.err as string | undefined,
    };
  },
});

function RouteComponent() {
  const { err } = useSearch({ from: "/login" });

  return (
    <main className="w-full min-h-screen flex items-center justify-center bg-linear-to-br from-[#1a0b2e] via-[#2d1b4e] to-[#1a0b2e]">
      <section className="flex flex-col max-w-6xl justify-center items-center gap-y-5">
        {/* Logo */}
        <div className="w-20 h-20 bg-linear-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center shadow-[0px_0px_40px] shadow-primary hover:shadow-[0px_0px_50px] transition-shadow">
          <Store className="w-10 h-10" />
        </div>
        {/* Title */}
        <h1 className="text-4xl font-bold">
          Bienvenido a{" "}
          <Highlighter
            action="underline"
            color="#8e51ff"
            iterations={3}
            padding={1}
          >
            <span className="tracking-tight">Cápita</span>
          </Highlighter>
          {/* Description */}
        </h1>
        <p className="text-center text-zinc-400">
          Promociona y Descubre productos y servicios dentro del campues de la
          UNAL sede medallo !
        </p>
      </section>
      {/* {err && (
        <Alert variant={"destructive"} className="max-w-md">
          <AlertCircleIcon />
          <AlertTitle>{"Google Login failed"}</AlertTitle>
          <AlertDescription>
            <p>{err}</p>
          </AlertDescription>
        </Alert>
      )} */}
    </main>
  );
}
