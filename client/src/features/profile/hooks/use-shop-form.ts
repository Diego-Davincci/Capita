import { useState, type ChangeEvent, type FormEvent } from "react";
import { toast } from "sonner";
import { useShallow } from "zustand/shallow";
import { useApiMutation } from "@/hooks";
import type { ApiRsp } from "@/types";
import { validateFields, type FormFieldValidation, API_URL } from "@/lib/utils";
import {
  shopDetailsSchema,
  type ShopDetails,
  type ShopPayload,
} from "../types";
import { useStore } from "@/store";

/**
 * Manages state, validation and API mutation for the shop details form
 * (name + description only — phone number is handled by usePhoneForm).
 * Sends the saved phoneNumber from the store on every save to preserve
 * the upsert contract.
 *
 * @returns Form values, field errors, loading state and event handlers
 * ready to be spread onto <ShopInformationForm />.
 *
 * @test cases:
 * - onSubmit sets validation errors when description is set without a name
 * - onSubmit does NOT call mutate when validation fails
 * - onSubmit calls mutate with the correct payload including phoneNumber from store
 * - isPending is true while the mutation is in-flight
 * - "Tienda guardada exitosamente!" toast fires when creating a new shop
 * - "Tienda actualizada exitosamente!" toast fires when updating an existing shop
 * - No toast fires when deleting a shop (clearing name)
 * - hasChanges is false when name and description match the saved store values
 * - hasChanges is true when name or description differs from the saved store values
 * - Store normalizes empty strings to null for shopName and shopDescription
 */
export const useShopForm = () => {
  const { user, updateUser } = useStore(
    useShallow((state) => ({ user: state.user, updateUser: state.updateUser })),
  );
  const [shopDetails, setShopDetails] = useState<ShopDetails>({
    name: user.shopName ? user.shopName : "",
    description: user.shopDescription ? user.shopDescription : "",
  });
  const [errors, setErrors] = useState<FormFieldValidation[]>([]);

  const hasChanges =
    shopDetails.name !== (user.shopName ?? "") ||
    shopDetails.description !== (user.shopDescription ?? "");

  const { isPending, mutate } = useApiMutation<ShopPayload, ApiRsp<undefined>>({
    method: "POST",
    url: `${API_URL}/users/me/shop`,
    onSuccessFn: () => {
      // Show toast notification based on whether this is a new shop, update, or deletion
      if (shopDetails.name && shopDetails.name !== "") {
        const toastTitle = user.shopName
          ? "Tienda actualizada exitosamente! 🛍️"
          : "Tienda guardada exitosamente! 🛍️";
        toast.success(toastTitle, {
          position: "top-center",
          duration: 7000,
        });
      }
      // No toast when deleting a shop (clearing name)

      // Save store info — normalize empty strings to null
      updateUser({
        ...user,
        shopName: shopDetails.name || null,
        shopDescription: shopDetails.description || null,
      });
    },
  });

  const onChangeName = (e: ChangeEvent<HTMLInputElement>) => {
    setShopDetails({ ...shopDetails, name: e.target.value });
  };

  const onChangeDescription = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setShopDetails({ ...shopDetails, description: e.target.value });
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const validationErrors = validateFields(shopDetailsSchema, shopDetails);
    setErrors(validationErrors);
    if (validationErrors.length === 0) {
      mutate({
        payload: {
          phoneNumber: user.phoneNumber ?? "",
          name: shopDetails.name ?? "",
          description: shopDetails.description ?? "",
        },
      });
    }
  };

  return {
    shopDetails,
    errors,
    isPending,
    hasChanges,
    onChangeName,
    onChangeDescription,
    onSubmit,
  };
};
