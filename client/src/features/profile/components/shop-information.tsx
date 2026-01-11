import { MessageCircle, Store } from "lucide-react";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useState, type FormEvent } from "react";
import { shopDetailsSchema, type ShopDetails } from "../types";
import {
  validateFields,
  type FormFieldValidation,
  findFieldError,
} from "@/lib/utils";

export const ShopInformation = () => {
  const [shopName, setShopName] = useState<string>("");
  const [shopDescription, setShopDescription] = useState<string>("");
  const [shopWhatsappLink, setShopWhatsappLink] = useState<string>("");
  const [shopDetailsErrs, setShopDetailsErrs] = useState<FormFieldValidation[]>(
    []
  );

  const handleShopDetails = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const shopDetails: ShopDetails = {
      shopName,
      shopDescription,
      shopWhatsappLink,
    };

    const errors = validateFields(shopDetailsSchema, shopDetails);
    setShopDetailsErrs(errors);
  };

  return (
    <div>
      <h3 className="flex items-center gap-x-2 text-xl font-semibold mb-7">
        <Store className="size-6 text-primary" />
        Mi Emprendimiento o Tienda
      </h3>
      <form
        className="w-full flex flex-col gap-y-7"
        onSubmit={(e) => {
          handleShopDetails(e);
        }}
      >
        {/* Shop name */}
        <div className="flex flex-col gap-y-3">
          <Label
            htmlFor="shop-name"
            className="text-violet-200/70 font-semibold"
          >
            Nombre de la Tienda
          </Label>
          <div className="space-y-0.5">
            <Input id="shop-name" placeholder="Ej: Accesorios Danielita 💍" />
            {findFieldError("shopName", shopDetailsErrs) && (
              <span className="text-sm text-destructive">
                {findFieldError("shopName", shopDetailsErrs)!.message}
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
          />
        </div>
        {/* Whatsapp link */}
        <div className="flex flex-col gap-y-3">
          <Label
            htmlFor="shop-link"
            className="text-violet-200/70 font-semibold"
          >
            <MessageCircle className="size-5 text-green-400" />
            Link de WhatsApp
          </Label>
          <div className="space-y-1">
            <Input
              id="shop-link"
              placeholder="https://whatsapp.com/channel/0029VaeyO64LNSa1krjoqw3w"
            />
            <span className="text-xs text-muted-foreground">
              L@s comprador@s podrán contactarte directamente por WhatsApp
            </span>
            {findFieldError("shopWhatsappLink", shopDetailsErrs) && (
              <span className="text-sm text-destructive block">
                {findFieldError("shopWhatsappLink", shopDetailsErrs)!.message}
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
        >
          Guardar Cambios
        </Button>
      </form>
    </div>
  );
};
