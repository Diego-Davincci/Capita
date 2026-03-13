import { z } from "zod";

export const sellPostSchema = z.object({
  title: z
    .string()
    .min(1, { error: "El titulo es obligatorio" })
    .max(80, { error: "Titulo debe tener máximo 80 caracteres" }),
  description: z
    .string()
    .max(1000, { error: "Descripción debe tener máximo 1000 caracteres" })
    .optional(),
  price: z.number().min(1, { error: "El precio es obligatorio" }),
  category: z.string().min(1, { error: "La categoría es obligatoria" }),
  media: z
    .any()
    .refine((file) => file instanceof File, "La foto es obligatoria")
    .refine((file) => file && file.size > 0, "La foto es obligatoria"),
});

export type SellPost = z.infer<typeof sellPostSchema>;

export interface FeedPosts {
  username: string;
  userPicture: string;
  postID: number;
  userID: number;
  title: string;
  description: string | null;
  price: number;
  category: string;
  postPhotoURL: string;
  registeredAt: Date;
  whatsappLink?: string | null;
  shopName?: string | null;
  shopDescription?: string | null;
}
