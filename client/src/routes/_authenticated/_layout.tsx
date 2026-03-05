import { Navbar } from "@/components/layout/navbar";
import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/_layout")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <main className="w-full min-h-screen bg-linear-to-b from-[#1a0b2e] via-[#2a1348] to-[#2d1b4e]">
      {/* Navbar */}
      <Navbar />
      {/* Rest of the content */}
      <Outlet />
    </main>
  );
}
