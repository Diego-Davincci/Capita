import { z } from "zod";

export const shopDetailsSchema = z.object({
  name: z
    .string()
    .max(50, { error: "Nombre de la tienda máximo 50 caracteres" })
    .optional(),
  description: z.string().optional(),
  phoneNumber: z
    .string()
    .min(1, {
      error:
        "Introduce un número de WhatsApp válido (solo dígitos, 10 caracteres)",
    })
    .length(10, { error: "El número introducido no posee 10 caracteres" }),
});

export type ShopDetails = z.infer<typeof shopDetailsSchema>;
