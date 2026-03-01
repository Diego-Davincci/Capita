import { useShopForm } from "../hooks";
import { ShopInformationForm } from "./shop-information-form";

/** Container that wires useShopForm state and handlers to ShopInformationForm. */
export const ShopInformation = () => {
  const form = useShopForm();

  return <ShopInformationForm {...form} />;
};
