/*
    Global custom query to make all types of GET Requests
*/

import { getHttpRequest } from "@/lib/api/client";
import { useQuery } from "@tanstack/react-query";

/**
 * Global custom query hook for performing API GET Requests
 *
 * This hook wraps `useQuery` from Tanstack Query and provides :
 * - Centralized HTTP get requests logic
 * - Error handling first
 *
 * @param queryKey - Unique query key for the request
 * @param url - Backend API URL
 *
 */
export const useGetQuery = <Response>({
  queryKey,
  url,
}: {
  queryKey: string[];
  url: string;
}) => {
  return useQuery({
    queryKey,
    queryFn: () => getHttpRequest<Response>(url),
  });
};
