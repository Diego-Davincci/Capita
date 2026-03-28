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
  postID: number;
  userID: number;
  title: string;
  description: string | null;
  price: number;
  postPhotoURL: string;
  registeredAt: Date;
  category: string;
  username: string;
  userPicture: string;
  phoneNumber?: string | null;
  shopName?: string | null;
  shopDescription?: string | null;
}

export interface SellPostRsp {
  userID: number;
  postID: number;
  title: string;
  description: string | null;
  price: number;
  category: string;
  postPhotoURL: string;
  registeredAt: Date;
}

/** Paginated feed response from GET /posts */
export interface FeedPostsPage {
  posts: FeedPosts[];
  hasNextPage: boolean;
  nextCursor: string;
}
