import type { Dispatch, SetStateAction } from "react";
import { Camera, X } from "lucide-react";
import { useRef, useState, type ChangeEvent, type FormEvent } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { categories } from "../utils";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { sellPostSchema, type SellPost } from "../types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  validateFields,
  type FormFieldValidation,
  findFieldError,
} from "@/lib/utils";

type Props = {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
};

export const SellPostModal = ({ open, setOpen }: Props) => {
  const [sellPost, setSellPost] = useState<SellPost>({
    title: "",
    description: "",
    category: "",
    media: new File([], ""),
    price: 0,
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const uploadImgRef = useRef<HTMLInputElement>(null);
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setSellPost({ ...sellPost, media: file });
    }
  };

  const [displayPrice, setDisplayPrice] = useState<string>("");
  const handlePrice = (e: ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    // Allow only numbers
    const cleanedPrice = inputValue.replace(/[^0-9]/g, "");

    // Add thousand separator
    const formattedPrice = new Intl.NumberFormat("en-US").format(
      Number(cleanedPrice)
    );

    setDisplayPrice(formattedPrice);
    setSellPost({ ...sellPost, price: Number(formattedPrice) });
  };

  const [sellPostErrs, setSellPostErrs] = useState<FormFieldValidation[]>([]);
  const handleSellPostSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const errors = validateFields(sellPostSchema, sellPost);
    setSellPostErrs(errors);
  };

  console.log(sellPostErrs);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className={
          "max-w-lg! border border-border max-h-[90vh] overflow-hidden overflow-y-scroll"
        }
      >
        {/* Header */}
        <DialogHeader>
          <DialogTitle className={"font-bold text-xl"}>
            Crear Publicación
          </DialogTitle>
        </DialogHeader>
        {/* Content */}
        <form className="space-y-5" onSubmit={handleSellPostSubmit}>
          {/* Upload Image */}
          <div className="space-y-4">
            <Label htmlFor="create-post-image">
              Foto del producto/servicio 📸
            </Label>
            {imagePreview ? (
              <div className="w-full h-80 rounded-2xl overflow-hidden relative">
                <img
                  src={imagePreview}
                  className="object-cover w-full h-full"
                />
                <Button
                  variant={"secondary"}
                  size={"icon"}
                  className={"absolute top-2 right-2 cursor-pointer"}
                  onClick={() => setImagePreview(null)}
                >
                  <X />
                </Button>
              </div>
            ) : (
              <button
                type="button"
                className="w-full h-80 flex flex-col items-center justify-center border-dashed border-2 rounded-2xl border-primary/40 hover:border-primary transition-all fade-out text-muted-foreground hover:text-white"
                onClick={() => {
                  uploadImgRef.current?.click();
                }}
              >
                <Camera />
                Subir Foto
              </button>
            )}
            <input
              id="create-post-image"
              ref={uploadImgRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleImageChange(e)}
            />
          </div>
          {/* Title */}
          <div className="space-y-4">
            <Label htmlFor="create-post-title">
              Foto del producto/servicio 📸
            </Label>
            <div className="space-y-0.5">
              <Input
                id="create-post-title"
                placeholder="Ej: Auriculares para Estudio"
                value={sellPost.title}
                onChange={(e) =>
                  setSellPost({ ...sellPost, title: e.target.value })
                }
              />
              {findFieldError("title", sellPostErrs) && (
                <span className="text-xs text-destructive">
                  {findFieldError("title", sellPostErrs)!.message}
                </span>
              )}
            </div>
          </div>
          {/* Descripción */}
          <div className="space-y-4">
            <Label htmlFor="create-post-description">Descripción</Label>
            <Textarea
              className="h-32"
              id="create-post-description"
              placeholder="Ej: Samsung Galaxy Aiurbud Core perfectos para sesiones de estudio 📚 profundas. Cancelación de audio de ultima generación."
              value={sellPost.description}
              onChange={(e) =>
                setSellPost({ ...sellPost, description: e.target.value })
              }
            />
          </div>
          {/* Price */}
          <div className="space-y-4">
            <Label htmlFor="create-post-price">Precio</Label>
            <div className="space-y-0.5">
              <InputGroup>
                <InputGroupAddon align={"inline-start"}>
                  <InputGroupText>$</InputGroupText>
                </InputGroupAddon>
                <InputGroupInput
                  id="create-post-price"
                  type="text"
                  inputMode="numeric"
                  placeholder="50.000"
                  value={displayPrice}
                  onChange={handlePrice}
                />
              </InputGroup>
              {findFieldError("price", sellPostErrs) && (
                <span className="text-xs text-destructive">
                  {findFieldError("price", sellPostErrs)!.message}
                </span>
              )}
            </div>
          </div>
          {/* Category */}
          <div className="space-y-4">
            <Label htmlFor="create-post-category">Categoría</Label>
            <div className="space-y-0.5">
              <Select
                id="create-post-category"
                value={sellPost.category}
                onValueChange={(v) => {
                  if (v) setSellPost({ ...sellPost, category: v });
                }}
              >
                <SelectTrigger className={"w-full"}>
                  <SelectValue>
                    {sellPost.category !== ""
                      ? sellPost.category
                      : "Seleccionar"}
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
              {findFieldError("category", sellPostErrs) && (
                <span className="text-xs text-destructive">
                  {findFieldError("category", sellPostErrs)!.message}
                </span>
              )}
            </div>
          </div>
          <Button type="submit" className={"cursor-pointer w-full"}>
            Publicar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
