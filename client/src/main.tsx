import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Navigate, RouterProvider, createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen.ts";
import { Toaster } from "sonner";
import * as motion from "motion/react-client";

import "./index.css";
import ReactQueryWrapper from "./lib/api/query-client.tsx";
import { ThemeProvider } from "./components/theme-provider.tsx";
import { useMe } from "./features/auth/hooks";
import { AlertCircleIcon, Store } from "lucide-react";
import { Highlighter } from "./components/ui/highlighter.tsx";
import { Alert, AlertDescription, AlertTitle } from "./components/ui/alert.tsx";

const router = createRouter({
  routeTree,
  context: {
    isAuthorized: false,
  },
  defaultNotFoundComponent: () => {
    return <Navigate to={"/"} replace />;
  },
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

function App() {
  const { loading, error } = useMe();

  // If we detect a ?err query in the URL, that means google login failed for the user
  // const isLoginErr = window.location.href.includes("/login?err");

  if (loading) {
    return (
      <main className="min-h-screen w-full flex items-center justify-center bg-linear-to-b from-[#1a0b2e] to-[#2d1b4e]">
        <section className="max-w-5xl flex flex-col gap-y-5 my-7 mx-10 items-center justify-center">
          {/* Logo */}
          <motion.div
            className="size-16 sm:size-20 bg-linear-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center shadow-[0px_0px_40px] shadow-primary hover:shadow-[0px_0px_50px] transition-shadow"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 0.5,
              scale: { type: "spring", visualDuration: 0.4, bounce: 0.5 },
            }}
          >
            <Store className="size-12 sm:size-10" />
          </motion.div>
          <h1 className="text-xl sm:text-3xl font-bold text-center">
            <Highlighter
              action="underline"
              color="#8e51ff"
              iterations={3}
              padding={1}
              animationDuration={500}
            >
              <span className="tracking-tight">Cápita</span>
            </Highlighter>
          </h1>
        </section>
      </main>
    );
  }

  if (error && error.statusCode >= 500) {
    return (
      <main className="min-h-screen w-full flex items-center justify-center bg-linear-to-b from-[#1a0b2e] to-[#2d1b4e]">
        <Alert variant={"destructive"} className="max-w-md">
          <AlertCircleIcon />
          <AlertTitle>{error?.name}</AlertTitle>
          <AlertDescription>
            <p>{error?.message}</p>
          </AlertDescription>
        </Alert>
      </main>
    );
  }

  return (
    <ThemeProvider defaultTheme="dark" storageKey="capita-dark-theme">
      <ReactQueryWrapper>
        <Toaster richColors />
        <RouterProvider
          router={router}
          context={{
            isAuthorized: !error ? true : false,
          }}
        />
      </ReactQueryWrapper>
    </ThemeProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
