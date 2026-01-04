/* Useful functions to use everywhere */

import { twMerge } from "tailwind-merge";
import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface ApiError extends Error {
  statusCode: number;
}

/**
 * Creates a standardized Error object for API-related failures.
 *
 * This utility helps centralize API error creation by attaching
 * a custom title and HTTP status code to a native `Error` instance.
 *
 * @param {Object} params - API error configuration.
 * @param {string} params.errorTitle - Short, human-readable title for the error.
 * @param {string} params.errorMsg - Detailed error message returned by the backend.
 * @param {number} params.statusCode - HTTP status code associated with the error.
 *
 * @returns {Error} An Error object enriched with `name`, `message`,
 * and a custom `statusCode` property.
 *
 * @example
 * ```ts
 * throw createNewApiError({
 *   errorTitle: "Unauthorized",
 *   errorMsg: "Invalid access token",
 *   statusCode: 401,
 * });
 * ```
 */
export const createNewApiError = ({
  errorTitle,
  errorMsg,
  statusCode,
}: {
  errorTitle: string;
  errorMsg: string;
  statusCode: number;
}): ApiError => {
  const apiError = new Error("Problems with the API") as ApiError;
  apiError.name = errorTitle;
  apiError.message = errorMsg;
  apiError.statusCode = statusCode;

  return apiError;
};
