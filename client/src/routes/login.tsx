import { createFileRoute, redirect } from "@tanstack/react-router";
import { LoginPage } from "@/features/auth/components";

type LoginParams = {
  err?: string;
};

export const Route = createFileRoute("/login")({
  component: LoginPage,
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
