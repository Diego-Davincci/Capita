export interface User {
  userID: number;
  email: string;
  username: string;
  picture: string;
  isUserValid: boolean;
  shopName?: string | null;
  shopDescription?: string | null;
  phoneNumber?: string | null;
}
