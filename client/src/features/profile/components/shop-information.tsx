import { useStore } from "@/store";
import { useShopForm } from "../hooks";
import { ShopInformationForm } from "./shop-information-form";

/**
 * Container that wires useShopForm state and handlers to ShopInformationForm.
 * Locks the shop form until the user has saved a phone number.
 */
export const ShopInformation = () => {
  const form = useShopForm();
  const user = useStore((store) => store.user);
  const isLocked = !user.phoneNumber;

  return <ShopInformationForm {...form} isLocked={isLocked} />;
};
