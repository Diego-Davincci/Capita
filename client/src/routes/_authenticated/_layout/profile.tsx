import { createFileRoute } from "@tanstack/react-router";

import { Separator } from "@/components/ui/separator";
import {
  PersonalInformation,
  ShopInformation,
} from "@/features/profile/components";

export const Route = createFileRoute("/_authenticated/_layout/profile")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <section className="w-3/5 max-w-7xl m-auto flex flex-col py-10">
      {/* Title */}
      <h1 className="text-3xl font-bold">Mi Perfil</h1>
      <p className="my-1 text-muted-foreground">
        Gestiona tu información personal (y tienda 🛍️ si tienes una)
      </p>

      {/* Profile Information */}
      <div className="w-full rounded-2xl border border-violet-400/20 mt-5 relative bg-white/5 backdrop-blur-xl">
        {/* Nice color background */}
        <div className="absolute inset-0 bg-linear-to-br from-violet-500/10 to-purple-600/10 rounded-2xl blur-xl" />
        <div className="w-[90%] m-auto my-7 flex flex-col relative gap-y-8">
          <PersonalInformation />
          <Separator />
          <ShopInformation />
        </div>
      </div>
    </section>
  );
}
