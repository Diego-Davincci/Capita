import type { ChangeEvent, FormEvent, RefObject } from "react";
import { Camera, Loader2, X } from "lucide-react";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { findFieldError, type FormFieldValidation } from "@/lib/utils";
import { categories } from "../utils";
import type { SellPost } from "../types";

type Props = {
  sellPost: SellPost;
  displayPrice: string;
  imagePreview: string | null;
  errors: FormFieldValidation[];
  isPending: boolean;
  uploadImgRef: RefObject<HTMLInputElement | null>;
  onChangeTitle: (e: ChangeEvent<HTMLInputElement>) => void;
  onChangeDescription: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  onChangeCategory: (value: string | null) => void;
  onChangePrice: (e: ChangeEvent<HTMLInputElement>) => void;
  onImageChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: () => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
};

/**
 * Pure presentational form for creating a sell post.
 * Renders image upload, title, description, price, category fields
 * and submit button. All state and handlers arrive via props.
 *
 * @test cases:
 * - All inputs render as disabled when isPending is true
 * - Image preview renders when imagePreview is not null
 * - Upload placeholder renders when imagePreview is null
 * - Remove-image button calls onRemoveImage
 * - Upload placeholder triggers uploadImgRef click
 * - Field error spans render when errors contain matching field name
 * - Field error spans are absent when errors is empty
 * - Title character counter displays sellPost.title.length/80
 * - Description character counter displays sellPost.description.length/1000
 * - Submit button shows Loader2 spinner when isPending is true
 * - onSubmit is called when the form is submitted
 * - Category select calls onChangeCategory with selected value
 */
export const SellPostForm = ({
  sellPost,
  displayPrice,
  imagePreview,
  errors,
  isPending,
  uploadImgRef,
  onChangeTitle,
  onChangeDescription,
  onChangeCategory,
  onChangePrice,
  onImageChange,
  onRemoveImage,
  onSubmit,
}: Props) => {
  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      {/* Upload Image */}
      <div className="space-y-4">
        <Label htmlFor="create-post-image">
          Foto del producto/servicio 📸
        </Label>
        <div className="space-y-0.5">
          {imagePreview ? (
            <div className="w-full h-80 rounded-2xl overflow-hidden relative">
              <img
                src={imagePreview}
                className="object-cover w-full h-full"
              />
              <Button
                variant="secondary"
                size="icon"
                className="absolute top-2 right-2 cursor-pointer"
                disabled={isPending}
                onClick={onRemoveImage}
              >
                <X />
              </Button>
            </div>
          ) : (
            <button
              type="button"
              className="w-full h-80 flex flex-col items-center justify-center border-dashed border-2 rounded-2xl border-primary/40 hover:border-primary transition-all fade-out text-muted-foreground hover:text-white"
              onClick={() => uploadImgRef.current?.click()}
              disabled={isPending}
            >
              <Camera />
              Subir Foto
            </button>
          )}
          <input
            id="create-post-image"
            ref={uploadImgRef}
            type="file"
            accept="image/png, image/jpg, image/jpeg"
            className="hidden"
            onChange={onImageChange}
            disabled={isPending}
          />
          {findFieldError("media", errors) && (
            <span className="text-xs text-destructive">
              {findFieldError("media", errors)!.message}
            </span>
          )}
        </div>
      </div>

      {/* Title */}
      <div className="space-y-4">
        <Label htmlFor="create-post-title">
          Titulo del producto/servicio ✏️
        </Label>
        <div className="space-y-1">
          <Input
            id="create-post-title"
            placeholder="Ej: Auriculares para Estudio"
            value={sellPost.title}
            onChange={onChangeTitle}
            disabled={isPending}
          />
          {findFieldError("title", errors) && (
            <span className="text-xs text-destructive">
              {findFieldError("title", errors)!.message}
            </span>
          )}
          <span className="text-xs text-muted-foreground block">
            {sellPost.title.length}/80 Caracteres
          </span>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-4">
        <Label htmlFor="create-post-description">Descripción</Label>
        <div className="space-y-1">
          <Textarea
            className="h-32"
            id="create-post-description"
            placeholder="Ej: Samsung Galaxy Aiurbud Core perfectos para sesiones de estudio 📚 profundas. Cancelación de audio de ultima generación."
            value={sellPost.description}
            onChange={onChangeDescription}
            disabled={isPending}
          />
          <span className="text-xs text-muted-foreground block">
            {sellPost.description!.length}/1000 Caracteres
          </span>
        </div>
      </div>

      {/* Price */}
      <div className="space-y-4">
        <Label htmlFor="create-post-price">Precio</Label>
        <div className="space-y-0.5">
          <InputGroup>
            <InputGroupAddon align="inline-start">
              <InputGroupText>$</InputGroupText>
            </InputGroupAddon>
            <InputGroupInput
              id="create-post-price"
              type="text"
              inputMode="numeric"
              placeholder="50.000"
              value={displayPrice}
              onChange={onChangePrice}
              disabled={isPending}
            />
          </InputGroup>
          {findFieldError("price", errors) && (
            <span className="text-xs text-destructive">
              {findFieldError("price", errors)!.message}
            </span>
          )}
        </div>
      </div>

      {/* Category */}
      <div className="space-y-4">
        <Label htmlFor="create-post-category">Categoría</Label>
        <div className="space-y-0.5">
          <Select
            value={sellPost.category}
            onValueChange={onChangeCategory}
            disabled={isPending}
          >
            <SelectTrigger className="w-full">
              <SelectValue>
                {sellPost.category !== "" ? sellPost.category : "Seleccionar"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent align="center">
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {findFieldError("category", errors) && (
            <span className="text-xs text-destructive">
              {findFieldError("category", errors)!.message}
            </span>
          )}
        </div>
      </div>

      {/* Submit */}
      <Button
        type="submit"
        className="cursor-pointer w-full"
        disabled={isPending}
      >
        {isPending ? (
          <>
            <Loader2 className="animate-spin" />
            Creando la Publi
          </>
        ) : (
          "Publicar"
        )}
      </Button>
    </form>
  );
};
