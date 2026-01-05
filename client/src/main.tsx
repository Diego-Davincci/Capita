import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Navigate, RouterProvider, createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen.ts";
import { Toaster } from "sonner";

import "./index.css";
import ReactQueryWrapper from "./lib/api/query-client.tsx";
import { ThemeProvider } from "./components/theme-provider.tsx";
// import { useMe } from "./hooks/use-me.ts";
// import { SparklesText } from "./components/ui/sparkles-text.tsx";
// import { Alert, AlertDescription, AlertTitle } from "./components/ui/alert.tsx";
// import { AlertCircleIcon } from "lucide-react";

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
  // const { loading, error } = useMe();

  // if (loading) {
  //   return (
  //     <main className="min-h-screen w-full flex items-center justify-center">
  //       <SparklesText
  //         className="text-xl font-bold tracking-wide"
  //         sparklesCount={5}
  //       >
  //         Loading..
  //       </SparklesText>
  //     </main>
  //   );
  // }

  // if (error && error.statusCode >= 500) {
  //   return (
  //     <main className="min-h-screen w-full flex items-center justify-center">
  //       <Alert variant={"destructive"} className="max-w-md">
  //         <AlertCircleIcon />
  //         <AlertTitle>{error?.name}</AlertTitle>
  //         <AlertDescription>
  //           <p>{error?.message}</p>
  //         </AlertDescription>
  //       </Alert>
  //     </main>
  //   );
  // }

  return (
    <ThemeProvider defaultTheme="dark" storageKey="capita-dark-theme">
      <ReactQueryWrapper>
        <Toaster richColors />
        <RouterProvider
          router={router}
          context={{
            // isAuthorized: !error ? true : false,
            isAuthorized: false,
          }}
        />
      </ReactQueryWrapper>
    </ThemeProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
