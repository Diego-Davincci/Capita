import type { Dispatch, SetStateAction } from "react";
import { useNavigate } from "@tanstack/react-router";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useStore } from "@/store";
import { useSellPostForm } from "../hooks/use-sell-post-form";
import { SellPostWhatsappGate } from "./sell-post-whatsapp-gate";
import { SellPostForm } from "./sell-post-form";

type Props = {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
};

/**
 * Thin container/orchestrator for the sell-post modal.
 * Wires useSellPostForm hook, conditionally renders the WhatsApp gate
 * or the post creation form. All form logic lives in the hook;
 * all rendering lives in the presentational components.
 *
 * @test cases:
 * - Renders SellPostWhatsappGate when user has no phoneNumber
 * - Renders SellPostForm when user has a phoneNumber
 * - Modal cannot be dismissed while isPending is true
 * - Modal closes and form resets when dismissed while not pending
 */
export const SellPostModal = ({ open, setOpen }: Props) => {
  const navigate = useNavigate();
  const user = useStore((store) => store.user);
  const hasWhatsapp = user.phoneNumber;

  const form = useSellPostForm({
    onClose: () => setOpen(false),
  });

  return (
    <Dialog
      open={open}
      onOpenChange={() => {
        if (!form.isPending) {
          setOpen(false);
        }
      }}
      disablePointerDismissal={form.isPending}
    >
      <DialogContent
        className="max-w-lg! border border-border max-h-[90vh] overflow-hidden overflow-y-scroll"
      >
        {/* Header */}
        <DialogHeader>
          <DialogTitle className="font-bold text-xl">
            Crear Publicación
          </DialogTitle>
        </DialogHeader>

        {!hasWhatsapp ? (
          <SellPostWhatsappGate
            onNavigateToProfile={() => {
              navigate({ to: "/profile" });
              setOpen(false);
            }}
          />
        ) : (
          <SellPostForm {...form} />
        )}
      </DialogContent>
    </Dialog>
  );
};
