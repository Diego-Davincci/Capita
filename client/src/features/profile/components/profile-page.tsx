import { Store } from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PersonalInformation } from "./personal-information";
import { PhoneNumber } from "./phone-number";
import { ShopInformation } from "./shop-information";

/**
 * ProfilePage — user profile view.
 * Displays personal info (read-only), phone number form, and shop management form
 * in three separate cards.
 *
 * Test cases:
 * 1. Renders PersonalInformation with user data from the store
 * 2. Renders PhoneNumber form for WhatsApp number input
 * 3. Renders ShopInformation form with current shop details
 * 4. Advice section and Store icon tooltip are visible
 * 5. Layout is responsive across mobile, tablet, and desktop breakpoints
 */
export const ProfilePage = () => {
  return (
    <section className="w-full sm:w-[90%] lg:w-3/5 max-w-4xl m-auto flex flex-col py-10 gap-y-5 px-4 sm:px-0">
      {/* Title */}
      <h1 className="text-3xl font-bold">Mi Perfil</h1>
      <p className="my-1 text-muted-foreground">
        Gestiona tu información personal (y tienda 🛍️ si tienes una)
      </p>

      {/* Personal Information */}
      <div className="w-full rounded-2xl border border-violet-400/20 mt-5 relative bg-white/5 backdrop-blur-xl">
        <div className="absolute inset-0 bg-linear-to-br from-violet-500/10 to-purple-600/10 rounded-2xl blur-xl" />
        <div className="w-[90%] m-auto my-7 flex flex-col relative gap-y-8">
          <PersonalInformation />
        </div>
      </div>

      {/* Phone Number */}
      <div className="w-full rounded-2xl border border-violet-400/20 relative bg-white/5 backdrop-blur-xl">
        <div className="absolute inset-0 bg-linear-to-br from-violet-500/10 to-purple-600/10 rounded-2xl blur-xl" />
        <div className="w-[90%] m-auto my-7 flex flex-col relative gap-y-8">
          <PhoneNumber />
        </div>
      </div>

      {/* Shop Information */}
      <div className="w-full rounded-2xl border border-violet-400/20 relative bg-white/5 backdrop-blur-xl">
        <div className="absolute inset-0 bg-linear-to-br from-violet-500/10 to-purple-600/10 rounded-2xl blur-xl" />
        <div className="w-[90%] m-auto my-7 flex flex-col relative gap-y-8">
          <ShopInformation />
        </div>
      </div>

      {/* Advice */}
      <div className="w-full rounded-2xl border border-violet-400/20 relative bg-white/5 backdrop-blur-xl">
        <div className="absolute inset-0 bg-linear-to-br from-violet-500/10 to-purple-600/10 rounded-2xl blur-xl" />
        <div className="w-[90%] m-auto my-7 flex flex-col relative gap-y-3">
          <h3 className="text-xl font-semibold">💡 Consejo</h3>
          <div className="flex items-center justify-between gap-x-5">
            <p className="text-muted-foreground">
              Si completas la información de tu Tienda/Emprendimiento, tus posts
              adquirirán el siguiente simbolo para que los usuari@s te
              reconozcan.
            </p>
            <Tooltip>
              <TooltipTrigger delay={0}>
                <div className="border rounded-full p-2 hover:bg-zinc-100/10 transition-colors">
                  <Store className="text-purple-400 size-6" />
                </div>
              </TooltipTrigger>
              <TooltipContent>Esto es un Emprendimiento !</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </section>
  );
};
