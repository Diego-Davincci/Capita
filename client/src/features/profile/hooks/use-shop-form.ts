import { useState, type ChangeEvent, type FormEvent } from "react";
import { toast } from "sonner";
import { useShallow } from "zustand/shallow";
import { useApiMutation } from "@/hooks";
import type { ApiRsp } from "@/types";
import { validateFields, type FormFieldValidation, API_URL } from "@/lib/utils";
import { shopDetailsSchema, type ShopDetails } from "../types";
import { useStore } from "@/store";

/**
 * Manages all state, validation and API mutation for the shop details form.
 * Keeps business logic decoupled from the presentational layer so both
 * can be tested independently.
 *
 * @returns Form values, field errors, loading state and event handlers
 * ready to be spread onto <ShopInformationForm />.
 *
 * @test cases:
 * - handleWhatsappNumber strips non-digit characters from input
 * - onSubmit sets validation errors when required fields are empty
 * - onSubmit does NOT call mutate when validation fails
 * - onSubmit calls mutate with the correct ShopDetails payload when valid
 * - isPending is true while the mutation is in-flight
 * - success toast fires when the mutation resolves
 * - hasChanges is false when all fields match the saved store values
 * - hasChanges is true when any field differs from the saved store values
 */
export const useShopForm = () => {
  const { user, updateUser } = useStore(
    useShallow((state) => ({ user: state.user, updateUser: state.updateUser })),
  );
  const [shopDetails, setShopDetails] = useState<ShopDetails>({
    name: user.shopName ? user.shopName : "",
    description: user.shopDescription ? user.shopDescription : "",
    phoneNumber: user.phoneNumber ? user.phoneNumber : "",
  });
  const [errors, setErrors] = useState<FormFieldValidation[]>([]);

  const hasChanges =
    shopDetails.name !== (user.shopName ?? "") ||
    shopDetails.description !== (user.shopDescription ?? "") ||
    shopDetails.phoneNumber !== (user.phoneNumber ?? "");

  const { isPending, mutate } = useApiMutation<ShopDetails, ApiRsp<undefined>>({
    method: "POST",
    url: `${API_URL}/users/me/shop`,
    onSuccessFn: () => {
      // Show toast notification

      const toasTitle = user.shopName // Shop already created
        ? "Tienda actualizada existosamente! 🛍️"
        : shopDetails.name && shopDetails.name !== ""
          ? "Tienda guardada exitosamente! 🛍️"
          : "Número guardado exitosamente! 📱";
      toast.success(toasTitle, {
        position: "top-center",
        duration: 7000,
      });

      // Save store info to user
      updateUser({
        ...user,
        shopName: shopDetails.name,
        shopDescription: shopDetails.description,
        phoneNumber: shopDetails.phoneNumber,
      });
    },
  });

  /** Strips non-digit characters so only a valid phone number can be entered. */
  const onChangeWhatsapp = (e: ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/\D/g, "");
    setShopDetails({ ...shopDetails, phoneNumber: digitsOnly });
  };

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
      mutate({ payload: shopDetails });
    }
  };

  return {
    shopDetails,
    errors,
    isPending,
    hasChanges,
    onChangeName,
    onChangeDescription,
    onChangeWhatsapp,
    onSubmit,
  };
};
