import { MessageCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

type Props = {
  onNavigateToProfile: () => void;
};

/**
 * Gate notice displayed inside the sell-post modal when the user
 * has no WhatsApp number saved. Directs them to the profile page.
 * Pure presentational — no state, no hooks.
 *
 * @test cases:
 * - Renders the WhatsApp icon, heading text, and description
 * - Calls onNavigateToProfile when "Ir a mi Perfil" button is clicked
 * - Button is keyboard-accessible (focusable + Enter triggers click)
 */
export const SellPostWhatsappGate = ({ onNavigateToProfile }: Props) => {
  return (
    <div className="flex flex-col items-center gap-y-5 py-6 text-center">
      <MessageCircle className="size-12 text-green-400/60" />
      <div className="space-y-1">
        <p className="font-semibold">Necesitas un número de WhatsApp</p>
        <p className="text-sm text-muted-foreground">
          Agrégalo en tu perfil para poder publicar en Cápita.
        </p>
      </div>
      <Button className="cursor-pointer" onClick={onNavigateToProfile}>
        Ir a mi Perfil
      </Button>
    </div>
  );
};
