import { z } from "zod";

export const shopDetailsSchema = z.object({
  shopName: z
    .string()
    .min(1, { error: "Nombre de la tienda es obligatorio" })
    .max(50, { error: "Nombre de la tienda máximo 50 caracteres" }),
  shopDescription: z.string().optional(),
  shopWhatsappLink: z.string().regex(/^https:\/\/wa\.me\/\d{10}$/, {
    message:
      "Introduce un número de WhatsApp válido (solo dígitos, 10 caracteres)",
  }),
});

export type ShopDetails = z.infer<typeof shopDetailsSchema>;
