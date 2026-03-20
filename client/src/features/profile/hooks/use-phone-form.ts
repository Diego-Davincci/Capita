import { useState, type ChangeEvent, type FormEvent } from "react";
import { toast } from "sonner";
import { useShallow } from "zustand/shallow";
import { useApiMutation } from "@/hooks";
import type { ApiRsp } from "@/types";
import { validateFields, type FormFieldValidation, API_URL } from "@/lib/utils";
import { phoneSchema, type PhoneForm, type ShopPayload } from "../types";
import { useStore } from "@/store";

/**
 * Manages state, validation, and API mutation for the phone number form.
 * Sends all shop fields on every save to preserve the upsert contract
 * (the backend overwrites all columns on conflict).
 *
 * @returns phoneDetails, errors, isPending, hasChanges, onChangeWhatsapp, onSubmit
 *
 * @test cases:
 * - onChangeWhatsapp strips non-digit characters
 * - onSubmit sets error when phoneNumber is empty
 * - onSubmit sets error when phoneNumber.length !== 10
 * - onSubmit does NOT call mutate when validation fails
 * - mutate payload includes existing shopName and shopDescription from store
 * - success toast "Número guardado exitosamente 📱" fires on success
 * - hasChanges is false when phoneNumber matches store value
 * - hasChanges is true when phoneNumber differs from store value
 */
export const usePhoneForm = () => {
  const { user, updateUser } = useStore(
    useShallow((state) => ({ user: state.user, updateUser: state.updateUser })),
  );

  const [phoneDetails, setPhoneDetails] = useState<PhoneForm>({
    phoneNumber: user.phoneNumber ?? "",
  });
  const [errors, setErrors] = useState<FormFieldValidation[]>([]);

  const hasChanges = phoneDetails.phoneNumber !== (user.phoneNumber ?? "");

  const { isPending, mutate } = useApiMutation<ShopPayload, ApiRsp<undefined>>({
    method: "POST",
    url: `${API_URL}/users/me/shop`,
    onSuccessFn: () => {
      toast.success("Número guardado exitosamente 📱", {
        position: "top-center",
        duration: 7000,
      });

      updateUser({
        ...user,
        phoneNumber: phoneDetails.phoneNumber,
      });
    },
  });

  /** Strips non-digit characters so only a valid phone number can be entered. */
  const onChangeWhatsapp = (e: ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/\D/g, "");
    setPhoneDetails({ phoneNumber: digitsOnly });
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const validationErrors = validateFields(phoneSchema, phoneDetails);
    setErrors(validationErrors);
    if (validationErrors.length === 0) {
      mutate({
        payload: {
          phoneNumber: phoneDetails.phoneNumber,
          name: user.shopName ?? "",
          description: user.shopDescription ?? "",
        },
      });
    }
  };

  return {
    phoneDetails,
    errors,
    isPending,
    hasChanges,
    onChangeWhatsapp,
    onSubmit,
  };
};
