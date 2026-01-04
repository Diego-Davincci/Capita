import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <main className="w-full min-h-screen bg-linear-to-b from-[#1a0b2e] to-[#2f1651]">
      {/* Navbar */}
      <header className="w-full border-b sticky top-0 left-0 right-0 border-violet-500/20 h-16 bg-[#1a0b2e]">
        {/* Main Navigation */}
        <nav className="w-full h-full flex py-4 px-10 justify-between items-center">
          <div className="flex">
            <div className="w-10 h-10 rounded-lg bg-linear-to-br from-violet-500 to-purple-500">
              <img
                src="/logo.png"
                className="object-cover"
                alt="Website Icon"
              />
            </div>
            <h1>Cápita</h1>
          </div>
        </nav>
      </header>
    </main>
  );
}
