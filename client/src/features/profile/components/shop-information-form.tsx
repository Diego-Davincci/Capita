import { Loader2, Store } from "lucide-react";
import type { ChangeEvent, FormEvent } from "react";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { findFieldError, type FormFieldValidation } from "@/lib/utils";
import type { ShopDetails } from "../types";

type Props = {
  shopDetails: ShopDetails;
  errors: FormFieldValidation[];
  isPending: boolean;
  hasChanges: boolean;
  isLocked: boolean;
  onChangeName: (e: ChangeEvent<HTMLInputElement>) => void;
  onChangeDescription: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
};

/**
 * Pure presentational form for shop details (name + description).
 * Phone number is handled separately by the PhoneNumber component.
 * Receives all state and handlers via props — no internal state, no hooks.
 *
 * @test cases:
 * - All inputs render as disabled when isPending is true
 * - All inputs render as disabled when isLocked is true
 * - Locked notice renders when isLocked is true
 * - Submit button shows <Loader2> spinner when isPending is true
 * - Field error spans render when errors array contains matching field name
 * - Field error spans are absent when errors array is empty
 * - onSubmit is called when the form is submitted
 * - Submit button is disabled when hasChanges is false or isLocked is true
 * - Description textarea is disabled when shop name is empty
 */
export const ShopInformationForm = ({
  shopDetails,
  errors,
  isPending,
  hasChanges,
  isLocked,
  onChangeName,
  onChangeDescription,
  onSubmit,
}: Props) => {
  const isDescriptionDisabled = isPending || isLocked || !shopDetails.name;

  return (
    <div>
      <form className="w-full flex flex-col gap-y-7" onSubmit={onSubmit}>
        <h3 className="flex items-center gap-x-2 text-xl font-semibold">
          <Store className="size-6 text-primary" />
          Mi Emprendimiento o Tienda
        </h3>

        {isLocked && (
          <p className="text-sm text-muted-foreground">
            Primero guarda tu número de WhatsApp para activar tu tienda.
          </p>
        )}

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
              disabled={isPending || isLocked}
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
            disabled={isDescriptionDisabled}
          />
        </div>
        <Button
          type="submit"
          size={"lg"}
          className={
            "w-40 bg-linear-to-r from-violet-600 via-purple-600 to-fuchsia-500/40 cursor-pointer shadow-[0px_0px_2px] shadow-primary hover:shadow-[0px_0px_5px] transition-all hover:scale-105 active:scale-100"
          }
          disabled={isPending || !hasChanges || isLocked}
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
