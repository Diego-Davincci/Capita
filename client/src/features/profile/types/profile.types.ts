import { z } from "zod";

export const phoneSchema = z.object({
  phoneNumber: z
    .string()
    .min(1, {
      error:
        "Introduce un número de WhatsApp válido (solo dígitos, 10 caracteres)",
    })
    .length(10, { error: "El número introducido no posee 10 caracteres" }),
});

export type PhoneForm = z.infer<typeof phoneSchema>;

export const shopDetailsSchema = z
  .object({
    name: z
      .string()
      .max(50, { error: "Nombre de la tienda máximo 50 caracteres" })
      .optional(),
    description: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.description &&
      data.description.length > 0 &&
      (!data.name || data.name.length === 0)
    ) {
      ctx.addIssue({
        code: "custom",
        message:
          "Necesitas agregarle un nombre a tu tienda para tener una descripción.",
        path: ["name"],
      });
    }
  });

export type ShopDetails = z.infer<typeof shopDetailsSchema>;

/** Payload shape expected by POST /users/me/shop (all fields required for the upsert). */
export type ShopPayload = {
  phoneNumber: string;
  name: string;
  description: string;
};
