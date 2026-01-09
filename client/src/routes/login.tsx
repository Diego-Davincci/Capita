import { createFileRoute, redirect, useSearch } from "@tanstack/react-router";
import { Store } from "lucide-react";

import { BorderBeam } from "@/components/ui/border-beam";
import { Button } from "@/components/ui/button";
import { Highlighter } from "@/components/ui/highlighter";
import { API_URL } from "@/lib/utils";
import { useEffect } from "react";
import { toast } from "sonner";

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

  useEffect(() => {
    if (err) {
      toast.error("Tu autenticación con google ha fallado 😢", {
        duration: 60000,
        position: "top-center",
      });
    }
  }, [err]);

  return (
    <main className="w-full min-h-screen flex items-center justify-center bg-linear-to-br from-[#1a0b2e] via-[#2d1b4e] to-[#1a0b2e]">
      <section className="flex flex-col max-w-6xl justify-center items-center gap-y-5 mx-10 my-7">
        {/* Logo */}
        <div className="size-16 sm:size-20 bg-linear-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center shadow-[0px_0px_40px] shadow-primary hover:shadow-[0px_0px_50px] transition-shadow">
          <Store className="size-10 sm:size-8" />
        </div>
        <div className="flex flex-col items-center justify-start gap-y-3">
          {/* Title */}
          <h1 className="text-2xl sm:text-4xl font-bold text-center">
            Bienvenido a{" "}
            <Highlighter
              action="underline"
              color="#8e51ff"
              iterations={3}
              padding={1}
              animationDuration={2000}
            >
              <span className="tracking-tight">Cápita</span>
            </Highlighter>
            {/* Description */}
          </h1>
          <p className="text-center text-muted-foreground text-[15px] sm:text-base">
            Promociona y descubre productos y servicios dentro de la UNAL sede{" "}
            <br className="hidden sm:block" />
            Medallo, solo para miembros de la universidad !
          </p>
        </div>

        {/* Card */}
        <div className="flex items-center justify-start bg-linear-to-br from-violet-400/20 to-purple-500/20 rounded-3xl mt-5 overflow-hidden relative border max-w-xl">
          <div className="px-10 py-8 flex flex-col items-center gap-y-2">
            <h2 className="font-semibold text-xl">Iniciar Sesión</h2>
            <p className="text-muted-foreground text-center sm:text-base text-[15px]">
              Crea tu cuenta con 1 click. Solo si perteneces a la UNAL 😎
            </p>
            <a href={`${API_URL}/auth/google`}>
              <Button
                size={"lg"}
                className={"font-medium py-5.5 cursor-pointer my-4"}
              >
                {/* Google Icon */}
                <span className="w-7 h-7 rounded-full bg-white flex items-center justify-center">
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                      <path
                        fill="#4285F4"
                        d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"
                      />
                      <path
                        fill="#34A853"
                        d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"
                      />
                      <path
                        fill="#EA4335"
                        d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"
                      />
                    </g>
                  </svg>
                </span>
                Continuar con Google
              </Button>
            </a>
            {err && (
              <p className="text-red-400 text-center py-2">
                Ha hábido un problema para autenticarte con google, por favor
                intentalo de nuevo !
              </p>
            )}
            <p className="text-muted-foreground text-sm text-center">
              Prontamente : Términos y Condiciones...
            </p>
          </div>

          <BorderBeam
            duration={10}
            size={100}
            colorFrom={"#9333ea"}
            colorTo={"#e879f9"}
          />
        </div>

        {/* Made by me 💚 */}
        <p className="text-xs text-muted-foreground mt-10 text-center">
          Hecho con 💚 por{" "}
          <a
            className="underline"
            href="https://github.com/Diego-Davincci"
            target="_blank"
          >
            Diego Cifuentes
          </a>
          , para la Unal sede Medallo.
        </p>
      </section>
    </main>
  );
}
