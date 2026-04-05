export interface User {
  userID: number;
  email: string;
  username: string;
  picture: string;
  isBlocked: boolean;
  shopName?: string | null;
  shopDescription?: string | null;
  phoneNumber?: string | null;
}
