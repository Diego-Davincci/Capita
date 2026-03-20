import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { toast } from "sonner";

import { validateFields, type FormFieldValidation } from "@/lib/utils";
import { sellPostSchema, type SellPost } from "../types";
import { formatPrice } from "../utils";
import { useSellPost } from "./use-sell-post";

type UseSellPostFormOptions = {
  onClose: () => void;
};

/**
 * Manages all form state, validation, image preview, price formatting
 * and submission for the sell-post modal. Delegates the actual HTTP call
 * to `useSellPost`.
 *
 * @param onClose — called after a successful submission (toast + reset + close)
 *
 * @test cases:
 * - Initial state has empty title, description, category, price 0, no media
 * - onChangeTitle updates sellPost.title
 * - onChangeDescription updates sellPost.description
 * - onChangeCategory updates sellPost.category
 * - onChangePrice strips non-digits, formats with thousand separator, stores numeric value
 * - onImageChange reads file and sets imagePreview as data URL
 * - onRemoveImage clears imagePreview and sellPost.media
 * - onSubmit sets validation errors when required fields are empty
 * - onSubmit does NOT call mutateSellPost when validation fails
 * - onSubmit calls mutateSellPost when all fields are valid
 * - After successful submission: toast fires, form resets to initial state, onClose is called
 * - isPending is true while the mutation is in-flight
 * - uploadImgRef is a ref that can be assigned to a hidden file input
 */
export const useSellPostForm = ({ onClose }: UseSellPostFormOptions) => {
  // Form state
  const [sellPost, setSellPost] = useState<SellPost>({
    title: "",
    description: "",
    category: "",
    media: undefined,
    price: 0,
  });
  const [errors, setErrors] = useState<FormFieldValidation[]>([]);

  // Image preview
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const uploadImgRef = useRef<HTMLInputElement>(null);

  // Price display (formatted with thousand separators)
  const [displayPrice, setDisplayPrice] = useState<string>("");

  // --- Handlers ---

  const onChangeTitle = (e: ChangeEvent<HTMLInputElement>) => {
    setSellPost({ ...sellPost, title: e.target.value });
  };

  const onChangeDescription = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setSellPost({ ...sellPost, description: e.target.value });
  };

  const onChangeCategory = (value: string | null) => {
    if (value) setSellPost({ ...sellPost, category: value });
  };

  const onChangePrice = (e: ChangeEvent<HTMLInputElement>) => {
    const cleanedPrice = e.target.value.replace(/[^0-9]/g, "");
    const formattedPrice = formatPrice(cleanedPrice);
    setDisplayPrice(formattedPrice);
    setSellPost({
      ...sellPost,
      price: Number(formattedPrice.replaceAll(",", "")),
    });
  };

  const onImageChange = (e: ChangeEvent<HTMLInputElement>) => {
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

  const onRemoveImage = () => {
    setImagePreview(null);
    setSellPost({ ...sellPost, media: undefined });
  };

  // --- Submission ---

  const clearForm = () => {
    setSellPost({
      title: "",
      description: "",
      category: "",
      price: 0,
      media: undefined,
    });
    setDisplayPrice("");
    setImagePreview(null);
    setErrors([]);
  };

  const handleSuccess = () => {
    toast.success("Publicación creada exitosamente 🔥", {
      position: "top-center",
    });
    clearForm();
    onClose();
  };

  const { isPending, mutateSellPost } = useSellPost({
    payload: sellPost,
    onSuccess: handleSuccess,
  });

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const validationErrors = validateFields(sellPostSchema, sellPost);
    setErrors(validationErrors);
    if (validationErrors.length === 0) {
      mutateSellPost();
    }
  };

  return {
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
  };
};
