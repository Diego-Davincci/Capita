/*
    Global custom mutation hook to make all types of POST/UPDATE/DELETE Requests
*/

import { mutationHttpRequest } from "@/lib/api/client";
import type { ApiError } from "@/lib/utils/helpers";
import {
  useMutation,
  type QueryKey,
  type UseMutationResult,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

/**
 * Global custom mutation hook for performing API write operations
 * (POST, UPDATE, DELETE).
 *
 * This hook wraps `useMutation` from TanStack Query and provides:
 * - Centralized HTTP mutation logic
 * - Optional cache updates
 * - Optional query invalidation
 * - Automatic toast error handling
 *
 * @template Payload - Shape of the request payload sent to the API.
 * @template Response - Shape of the response returned by the API.
 *
 * @param {Object} options - Mutation configuration object.
 * @param {string} options.url - API endpoint URL.
 * @param {"POST" | "UPDATE" | "DELETE"} options.method - HTTP method to use.
 * @param {Function} [options.onSuccessFn] - Optional callback executed
 * after a successful mutation.
 * @param {QueryKey[]} [options.invalidateQueries] - List of query keys
 * to invalidate after a successful mutation.
 * @param {Object} [options.updateCache] - Optional cache update configuration.
 * @param {QueryKey} options.updateCache.queryKey - Query key to update.
 * @param {Function} options.updateCache.updater - Function that receives the
 * previous cached data, mutation response, and variables, and returns the new cache value.
 *
 * @returns {UseMutationResult<Response, ApiError, { payload: Payload }>}
 * TanStack Query mutation result object.
 *
 * @example
 * ```ts
 * const mutation = useApiMutation<
 *   { name: string },
 *   User
 * >({
 *   url: "/users",
 *   method: "POST",
 *   invalidateQueries: [["users"]],
 *   onSuccessFn: (data) => {
 *     console.log("User created:", data);
 *   },
 * });
 *
 * mutation.mutate({ payload: { name: "Diego" } });
 * ```
 */
export const useApiMutation = <
  Payload = Object | null | undefined,
  Response = Object | null
>({
  url,
  method,
  formData = false,
  onSuccessFn,
  invalidateQueries,
  updateCache,
}: {
  url: string;
  method: "DELETE" | "POST" | "UPDATE";
  formData?: boolean;
  onSuccessFn?: (
    data: Response,
    variables: { payload: Payload },
    context: unknown
  ) => void;
  invalidateQueries?: QueryKey[];
  updateCache?: {
    queryKey: QueryKey;
    updater: (
      oldData: any,
      responseData: Response,
      variables: { payload: Payload }
    ) => any;
  };
}): UseMutationResult<Response, ApiError, { payload: Payload }> => {
  const queryClient = useQueryClient();

  return useMutation<Response, ApiError, { payload: Payload }>({
    mutationFn: async ({ payload }) =>
      await mutationHttpRequest<Payload, Response>({
        method,
        url,
        payload,
        formData,
      }),
    onSuccess: (data, variables, context) => {
      // Update cache from another queries if requested
      if (updateCache) {
        queryClient.setQueryData(updateCache.queryKey, (olData: any) =>
          updateCache.updater(olData, data, variables)
        );
      }

      // Invalidate queries if requested
      if (invalidateQueries) {
        invalidateQueries.forEach((key) =>
          queryClient.invalidateQueries({ queryKey: key })
        );
      }

      // Fn that we'd like to run if the mutation is successful
      if (onSuccessFn) onSuccessFn(data, variables, context);
    },
    // If any error from the http request, render a toast showing the msg sent by the backend
    onError: (error, _variables, _context) => {
      toast.error(error.name, {
        description: error.message,
        duration: 10000,
      });
    },
  });
};
