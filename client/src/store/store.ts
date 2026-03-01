import type { User } from "@/types/common.types";
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
    isUserValid: true,
    shopName: null,
    shopDescription: null,
    shopWhatsappLink: null,
  },
  updateUser: (userData) =>
    set((store) => ({
      ...store,
      user: { ...userData },
    })),
}));
