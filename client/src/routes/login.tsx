import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { API_URL } from "@/lib/utils";
import { createFileRoute, redirect, useSearch } from "@tanstack/react-router";
import { AlertCircleIcon } from "lucide-react";

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
    <main className="w-full min-h-screen flex items-center justify-center flex-col gap-y-5">
      <Button onClick={() => {}} asChild>
        <a href={`${API_URL}/auth/google`}>Google</a>
      </Button>
      {err && (
        <Alert variant={"destructive"} className="max-w-md">
          <AlertCircleIcon />
          <AlertTitle>{"Google Login failed"}</AlertTitle>
          <AlertDescription>
            <p>{err}</p>
          </AlertDescription>
        </Alert>
      )}
    </main>
  );
}
