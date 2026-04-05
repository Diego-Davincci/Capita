import { getHttpRequest } from "@/lib/api/client";
import { API_URL, type ApiError } from "@/lib/utils";
import { useStore } from "@/store";
import { useEffect, useState } from "react";
import type { User } from "../types";

export const useMe = () => {
  /*
        Test cases :
        1. HTTP returns status code 401 (error gets returned)
        2. HTTP returns status code 5xx (error gets returned)
        3. HTTP return status code 200 (user data gets save in zustand)
        4. Check if route is "/login?err" in case it is, do not run the request
    */

  const [error, setError] = useState<ApiError | undefined>(undefined);
  const [isBlocked, setIsBlocked] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const updateUser = useStore((store) => store.updateUser);

  const getUser = async () => {
    try {
      setLoading(true);
      const userData = await getHttpRequest<User>(`${API_URL}/users/me`);
      updateUser(userData);
    } catch (error) {
      const err = error as ApiError;
      console.log(err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getUser();
  }, []);

  if (error?.statusCode == 401 && error.message?.includes("bloque")) {
    setIsBlocked(true);
  }

  return { error, loading, isBlocked };
};
