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
 */
export const useShopForm = () => {
  const { user, updateUser } = useStore(
    useShallow((state) => ({ user: state.user, updateUser: state.updateUser })),
  );
  const [shopDetails, setShopDetails] = useState<ShopDetails>({
    name: user.shopName ? user.shopName : "",
    description: user.shopDescription ? user.shopDescription : "",
    whatsappLink: user.shopWhatsappLink ? user.shopWhatsappLink : "",
  });
  const [errors, setErrors] = useState<FormFieldValidation[]>([]);

  const { isPending, mutate } = useApiMutation<ShopDetails, ApiRsp<undefined>>({
    method: "POST",
    url: `${API_URL}/users/me/shop`,
    onSuccessFn: () => {
      // Show toast notification
      const toasTitle = user.shopName
        ? "Tienda actualizada existosamente! 🛍️"
        : "Tienda guardada exitosamente! 🛍️";
      toast.success(toasTitle, {
        position: "top-center",
        duration: 7000,
      });

      // Save store info to user
      updateUser({
        ...user,
        shopName: shopDetails.name,
        shopDescription: shopDetails.description,
        shopWhatsappLink: shopDetails.whatsappLink,
      });
    },
  });

  /** Strips non-digit characters so only a valid phone number can be entered. */
  const onChangeWhatsapp = (e: ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/\D/g, "");
    setShopDetails({ ...shopDetails, whatsappLink: digitsOnly });
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
    onChangeName,
    onChangeDescription,
    onChangeWhatsapp,
    onSubmit,
  };
};
