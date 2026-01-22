import { z } from "zod";
export const sellPostSchema = z.object({
  title: z
    .string()
    .min(1, { error: "El titulo es obligatorio" })
    .max(70, { error: "Titulo debe tener máximo 70 carácteres" }),
  description: z
    .string()
    .max(400, { error: "Descripción debe tener máximo 400 carácteres" })
    .optional(),
  price: z.number().min(1, { error: "El precio es obligatorio" }),
  category: z.string().min(1, { error: "La categoría es obligatoria" }),
  media: z
    .any()
    .refine((file) => file instanceof File, "La foto es obligatoria")
    .refine((file) => file && file.size > 0, "La foto es obligatoria"),
});

export type SellPost = z.infer<typeof sellPostSchema>;
