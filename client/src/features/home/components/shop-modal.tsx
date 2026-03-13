import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { MessageCircle, Store } from "lucide-react";
import { createWhatsappLink } from "../utils";

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  shopName: string;
  shopDescription?: string | null;
  username: string;
  userPicture: string;
  whatsappLink: string;
};

/**
 * Modal that displays a seller's shop info when the user clicks
 * the "Esto es un Emprendimiento!" store icon on a post card.
 *
 * Test cases:
 * - Renders shop name and store icon header
 * - Shows seller avatar and username in the info row
 * - Shows placeholder text when shopDescription is null/undefined
 * - "Contactar tienda" button opens the correct WhatsApp link in a new tab
 * - Clicking outside or X closes the modal
 */
export const ShopModal = ({
  open,
  setOpen,
  shopName,
  userPicture,
  username,
  shopDescription,
  whatsappLink,
}: Props) => {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className={"max-w-sm! border border-border"}>
        {/* Header - store icon + shop name */}
        <DialogHeader className="items-center gap-y-4 pt-2">
          <div className="bg-violet-500/30 border border-violet-500/40 rounded-2xl p-4">
            <Store className="size-10 text-purple-300" strokeWidth={1.5} />
          </div>
          <DialogTitle className={"text-xl font-bold text-center"}>
            {shopName}
          </DialogTitle>
        </DialogHeader>

        <Separator className={"my-1"} />

        {/* Seller info row */}
        <div className="flex items-center gap-x-3 bg-white/5 border border-border/50 rounded-2xl px-4 py-3">
          <Avatar>
            <AvatarImage
              src={userPicture}
              alt="User profile pic"
              referrerPolicy="no-referrer"
            />
            <AvatarFallback className={"bg-primary/50 text-white"}>
              {username[0]}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium truncate">{username}</span>
        </div>

        {/* Shop description */}
        <div className="space-y-2">
          <p className="text-sm font-semibold text-violet-300/65">
            Sobre el negocio
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {shopDescription ??
              "Este emprendimiento aún no agrega una descripción."}
          </p>
        </div>

        {/* Contact CTA */}
        <Button
          className={
            "w-full cursor-pointer mt-1 bg-linear-to-r from-violet-600 via-purple-600 to-fuchsia-600 hover:scale-[1.02] active:scale-100 transition-all"
          }
          onClick={() =>
            window.open(createWhatsappLink(whatsappLink), "_blank")
          }
        >
          <MessageCircle className="size-4" />
          Contactar emprendimiento
        </Button>
      </DialogContent>
    </Dialog>
  );
};
