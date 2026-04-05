import type { User } from "@/features/auth/types";
import { create } from "zustand";

type State = {
  user: User;
};

interface Actions {
  updateUser: (user: State["user"]) => void;
}

export const useStore = create<State & Actions>()((set) => ({
  user: {
    userID: 0,
    username: "",
    email: "",
    picture: "",
    isBlocked: true,
    shopName: null,
    shopDescription: null,
    phoneNumber: null,
  },
  updateUser: (userData) =>
    set((store) => ({
      ...store,
      user: { ...userData },
    })),
}));
