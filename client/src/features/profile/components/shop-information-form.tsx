import { Loader2, MessageCircle, Store } from "lucide-react";
import type { ChangeEvent, FormEvent } from "react";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { findFieldError, type FormFieldValidation } from "@/lib/utils";
import type { ShopDetails } from "../types";
import { Separator } from "@/components/ui/separator";

type Props = {
  shopDetails: ShopDetails;
  errors: FormFieldValidation[];
  isPending: boolean;
  hasChanges: boolean;
  onChangeName: (e: ChangeEvent<HTMLInputElement>) => void;
  onChangeDescription: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  onChangeWhatsapp: (e: ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
};

/**
 * Pure presentational form for shop details. Receives all state and handlers
 * via props — no internal state, no hooks, no side effects.
 *
 * @test cases:
 * - All inputs render as disabled when isPending is true
 * - Submit button shows <Loader2> spinner when isPending is true
 * - Field error spans render when errors array contains matching field name
 * - Field error spans are absent when errors array is empty
 * - onSubmit is called when the form is submitted
 * - Submit button is disabled when hasChanges is false
 * - Submit button is enabled when hasChanges is true and not pending
 */
export const ShopInformationForm = ({
  shopDetails,
  errors,
  isPending,
  hasChanges,
  onChangeName,
  onChangeDescription,
  onChangeWhatsapp,
  onSubmit,
}: Props) => {
  return (
    <div>
      <form className="w-full flex flex-col gap-y-7" onSubmit={onSubmit}>
        {/* Phone number - required */}
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
              value={shopDetails.phoneNumber}
              onChange={onChangeWhatsapp}
              disabled={isPending}
            />
            <span className="text-xs text-muted-foreground">
              Necesario para publicar en Cápita. Los compradores te contactarán
              aquí.
            </span>
            {/* error span */}
            {findFieldError("name", errors) && (
              <span className="text-sm text-destructive">
                {findFieldError("name", errors)!.message}
              </span>
            )}
          </div>
        </div>

        <Separator />

        {/* Optional shop section */}

        <h3 className="flex items-center gap-x-2 text-xl font-semibold mb-7">
          <Store className="size-6 text-primary" />
          Mi Emprendimiento o Tienda - Opcional !
        </h3>
        {/* Shop name */}
        <div className="flex flex-col gap-y-3">
          <Label
            htmlFor="shop-name"
            className="text-violet-200/70 font-semibold"
          >
            Nombre de la Tienda
          </Label>
          <div className="space-y-0.5">
            <Input
              id="shop-name"
              placeholder="Ej: Accesorios Danielita 💍"
              value={shopDetails.name}
              onChange={onChangeName}
              disabled={isPending}
            />
            {findFieldError("name", errors) && (
              <span className="text-sm text-destructive">
                {findFieldError("name", errors)!.message}
              </span>
            )}
          </div>
        </div>
        {/* Shop description */}
        <div className="flex flex-col gap-y-3">
          <Label
            htmlFor="shop-description"
            className="text-violet-200/70 font-semibold"
          >
            Descripción de la Tienda
          </Label>
          <Textarea
            id="shop-description"
            className="h-52"
            placeholder="Vendemos anillos, aretas, relojes ⌚️, gafas 👓 y muchos más accesorios con los mejores descuentos 🔥"
            value={shopDetails.description}
            onChange={onChangeDescription}
            disabled={isPending}
          />
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
            "Guardar Cambios"
          )}
        </Button>
      </form>
    </div>
  );
};
