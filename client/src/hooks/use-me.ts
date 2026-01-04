import { getHttpRequest } from "@/lib/api/client";
import { API_URL, type ApiError } from "@/lib/utils";
import { useStore } from "@/store";
import type { User } from "@/types/common.types";
import { useEffect, useState } from "react";

export const useMe = () => {
  /*
        Test cases :
        1. HTTP returns status code 401 (error gets returned)
        2. HTTP returns status code 5xx (error gets returned)
        3. HTTP return status code 200 (user data gets save in zustand)
    */

  const [error, setError] = useState<ApiError | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(false);

  const updateUser = useStore((store) => store.updateUser);

  const getUser = async () => {
    try {
      setLoading(true);
      const userData = await getHttpRequest<User>(`${API_URL}/auth/me`);
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

  return { error, loading };
};
