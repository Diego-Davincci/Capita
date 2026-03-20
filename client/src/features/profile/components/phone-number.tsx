import { Loader2, MessageCircle } from "lucide-react";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { findFieldError } from "@/lib/utils";
import { usePhoneForm } from "../hooks";

/**
 * Phone number section of the profile page.
 * Renders a WhatsApp number input with validation and its own save button.
 * Must be saved before the shop section becomes active.
 *
 * @test cases:
 * - Input is disabled while isPending
 * - Error message renders for invalid/missing phone number
 * - Save button disabled when hasChanges is false
 * - Save button shows spinner when isPending
 * - onSubmit is called on form submit
 * - Only numeric characters are accepted (non-digits stripped)
 */
export const PhoneNumber = () => {
  const {
    phoneDetails,
    errors,
    isPending,
    hasChanges,
    onChangeWhatsapp,
    onSubmit,
  } = usePhoneForm();

  return (
    <div>
      <form className="w-full flex flex-col gap-y-7" onSubmit={onSubmit}>
        <div className="flex flex-col gap-y-3">
          <Label
            htmlFor="phone-number"
            className="text-violet-200/70 font-semibold"
          >
            <MessageCircle className="size-5 text-green-400" />
            Número de WhatsApp
          </Label>
          <div className="space-y-1 flex flex-col">
            <Input
              id="phone-number"
              placeholder="3105005517"
              inputMode="numeric"
              maxLength={10}
              value={phoneDetails.phoneNumber}
              onChange={onChangeWhatsapp}
              disabled={isPending}
            />
            <span className="text-xs text-muted-foreground">
              Necesario para publicar en Cápita. Los compradores te contactarán
              aquí.
            </span>
            {findFieldError("phoneNumber", errors) && (
              <span className="text-sm text-destructive">
                {findFieldError("phoneNumber", errors)!.message}
              </span>
            )}
          </div>
        </div>
        <Button
          type="submit"
          size={"lg"}
          className={
            "w-40 bg-linear-to-r from-violet-600 via-purple-600 to-fuchsia-500/40 cursor-pointer shadow-[0px_0px_2px] shadow-primary hover:shadow-[0px_0px_5px] transition-all hover:scale-105 active:scale-100"
          }
          disabled={isPending || !hasChanges}
        >
          {isPending ? (
            <>
              <Loader2 className="animate-spin" /> Guardando...
            </>
          ) : (
            "Guardar"
          )}
        </Button>
      </form>
    </div>
  );
};
