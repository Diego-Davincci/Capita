/**
 * Function to convert 35500 to 👉 35,500 (thousand operator)
 *
 * @param price - Value that we want to add thousand operator, eg : 43350
 * @returns {string}
 */
export const formatPrice = (price: string | number): string => {
  // Add thousand separator
  return new Intl.NumberFormat("en-US").format(Number(price));
};
