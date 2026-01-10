import { createFileRoute } from "@tanstack/react-router";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useStore } from "@/store";
import { Mail, User } from "lucide-react";

export const Route = createFileRoute("/_authenticated/_layout/profile")({
  component: RouteComponent,
});

function RouteComponent() {
  const user = useStore((store) => store.user);

  return (
    <section className="w-3/5 max-w-7xl m-auto flex flex-col my-10">
      {/* Title */}
      <h1 className="text-3xl font-bold">Mi Perfil</h1>
      <p className="my-1 text-muted-foreground">
        Gestiona tu información personal (y tienda 🛍️ si tienes una)
      </p>
      {/* Profile Information */}
      <div className="w-full rounded-2xl border border-violet-400/20 mt-5 relative bg-white/5 backdrop-blur-xl">
        {/* Nice color background */}
        <div className="absolute inset-0 bg-linear-to-br from-violet-500/10 to-purple-600/10 rounded-2xl blur-xl" />

        <div className="w-[90%] m-auto my-7 flex flex-col relative">
          {/* Personal Information */}
          <h2 className="flex items-center gap-x-2 text-xl font-semibold mb-7">
            <User className="size-6 text-primary" />
            Información Personal
          </h2>
          <div className="w-full flex items-center gap-x-5">
            <Avatar className="size-28 ring-4 ring-purple-500">
              <AvatarImage src={user.picture} alt="User Profile Pic" />
              <AvatarFallback className="bg-transparent text-white text-3xl">
                {user.username[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-y-1">
              <p className="text-wrap font-semibold text-lg">{user.username}</p>
              <p className="text-muted-foreground flex items-center gap-x-2">
                <Mail className="size-5" /> {user.email}
              </p>
            </div>
          </div>

          {/* Shop Details */}
        </div>
      </div>
    </section>
  );
}
