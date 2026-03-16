import type { Dispatch, SetStateAction } from "react";
import { Camera, Loader2, MessageCircle, X } from "lucide-react";
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
import { categories, formatPrice } from "../utils";
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
import { useSellPost } from "../hooks/use-sell-post";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { useStore } from "@/store";

type Props = {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
};

export const SellPostModal = ({ open, setOpen }: Props) => {
  // Form state
  const [sellPost, setSellPost] = useState<SellPost>({
    title: "",
    description: "",
    category: "",
    media: undefined,
    price: 0,
  });
  const [sellPostErrs, setSellPostErrs] = useState<FormFieldValidation[]>([]);

  // Image input
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
  const handleRemoveImageSelected = () => {
    setImagePreview(null);
    setSellPost({ ...sellPost, media: undefined });
  };

  // Price input
  const [displayPrice, setDisplayPrice] = useState<string>("");
  const handlePrice = (e: ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    // Allow only numbers
    const cleanedPrice = inputValue.replace(/[^0-9]/g, "");

    // Add thousand separator
    const formattedPrice = formatPrice(cleanedPrice);

    setDisplayPrice(formattedPrice);
    setSellPost({
      ...sellPost,
      price: Number(formattedPrice.replaceAll(",", "")),
    });
  };

  // Submit post form
  const clearModalData = () => {
    setOpen(false);
    setSellPost({
      title: "",
      description: "",
      category: "",
      price: 0,
      media: undefined,
    });
    setDisplayPrice("");
    setImagePreview(null);
    setSellPostErrs([]);
  };

  const onSuccess = () => {
    // Notification for confirmation
    toast.success("Publicación creada exitosamente 🔥", {
      position: "top-center",
    });
    // Clear modal data
    clearModalData();
  };
  const { isPending, mutateSellPost } = useSellPost({
    payload: sellPost,
    onSuccess,
  });
  const handleSellPostSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const errors = validateFields(sellPostSchema, sellPost);
    setSellPostErrs(errors);

    if (errors.length === 0) {
      mutateSellPost();
    }
  };

  const navigate = useNavigate();
  const user = useStore((store) => store.user);
  const hasWhatsapp = user.phoneNumber;

  /*
    QA Test
    1 - data validation ✅
    2 - when closing window, all data comes back to empty, including display price + image preview + validation errors ✅

    3 - loading state (can't close the window, can't modify media file input, title, description, price, category, loading button is not clickable and has animation) ✅
    4 - successfull http call (show notification, clear modal data, close modal)  ✅
    5 - http call error ✅
  */

  return (
    <Dialog
      open={open}
      onOpenChange={() => {
        // If request is not pending, we can close the modal
        if (!isPending) {
          clearModalData();
        }
      }}
      disablePointerDismissal={isPending}
    >
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

        {!hasWhatsapp ? (
          // Gate notice — replaces the form
          <div className="flex flex-col items-center gap-y-5 py-6 text-center">
            <MessageCircle className="size-12 text-green-400/60" />
            <div className="space-y-1">
              <p className="font-semibold">Necesitas un número de WhatsApp</p>
              <p className="text-sm text-muted-foreground">
                Agrégalo en tu perfil para poder publicar en Cápita.
              </p>
            </div>
            <Button
              className={"cursor-pointer"}
              onClick={() => {
                navigate({ to: "/profile" });
                setOpen(false);
              }}
            >
              Ir a mi Perfil
            </Button>
          </div>
        ) : (
          <>
            {/* Content */}
            <form className="space-y-5" onSubmit={handleSellPostSubmit}>
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
                        variant={"secondary"}
                        size={"icon"}
                        className={"absolute top-2 right-2 cursor-pointer "}
                        disabled={isPending}
                        onClick={handleRemoveImageSelected}
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
                    onChange={(e) => handleImageChange(e)}
                    disabled={isPending}
                  />
                  {findFieldError("media", sellPostErrs) && (
                    <span className="text-xs text-destructive">
                      {findFieldError("media", sellPostErrs)!.message}
                    </span>
                  )}
                </div>
              </div>
              {/* Title */}
              <div className="space-y-4">
                <Label htmlFor="create-post-title">
                  Foto del producto/servicio 📸
                </Label>
                <div className="space-y-1">
                  <Input
                    id="create-post-title"
                    placeholder="Ej: Auriculares para Estudio"
                    value={sellPost.title}
                    onChange={(e) =>
                      setSellPost({ ...sellPost, title: e.target.value })
                    }
                    disabled={isPending}
                  />
                  {findFieldError("title", sellPostErrs) && (
                    <span className="text-xs text-destructive">
                      {findFieldError("title", sellPostErrs)!.message}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground block">
                    {sellPost.title.length}/80 Caracteres
                  </span>
                </div>
              </div>
              {/* Descripción */}
              <div className="space-y-4">
                <Label htmlFor="create-post-description">Descripción</Label>
                <div className="space-y-1">
                  <Textarea
                    className="h-32"
                    id="create-post-description"
                    placeholder="Ej: Samsung Galaxy Aiurbud Core perfectos para sesiones de estudio 📚 profundas. Cancelación de audio de ultima generación."
                    value={sellPost.description}
                    onChange={(e) => {
                      setSellPost({ ...sellPost, description: e.target.value });
                    }}
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
                      disabled={isPending}
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
                    disabled={isPending}
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
              <Button
                type="submit"
                className={"cursor-pointer w-full"}
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
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
