// Provide custom methods to communicate with the API

import type { ApiRsp } from "@/types";
import { createNewApiError, type ApiError } from "../utils/helpers";

/**
 * Function to make GET Requests with error handling.
 *
 * The idea is to use a centralized function to execute GET Requests
 * and not duplicate code all over the place.
 *
 * @param {string} url - Backend URL
 */
export const getHttpRequest = async <Response>(
  url: string
): Promise<Response> => {
  try {
    const req = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    const rsp = (await req.json()) as ApiRsp<Response>;

    // Check if there's a server internal error, status code = 5xx
    if (rsp.statusCode >= 500) {
      const apiError = createNewApiError({
        errorTitle: "Algo ha salido mal !",
        errorMsg: rsp.message,
        statusCode: rsp.statusCode,
      });
      throw apiError;
    }
    // Check if user is unathorized, status code = 401
    if (rsp.statusCode === 401) {
      const apiError = createNewApiError({
        errorTitle: "Unauthorized",
        errorMsg: rsp.message,
        statusCode: rsp.statusCode,
      });
      throw apiError;
    }
    // Check if there was bad user input, status code = 400
    if (rsp.statusCode === 400) {
      const apiError = createNewApiError({
        errorTitle: "Bad input",
        errorMsg: rsp.message,
        statusCode: rsp.statusCode,
      });
      throw apiError;
    }

    return rsp.data;
  } catch (error) {
    const apiError = error as ApiError;
    console.error("HTTP Get Request went wrong: ", error);
    // If the error thrown has a "statusCode", it's a custome error
    if (apiError.statusCode) {
      throw apiError;
    }

    // Server is probably down
    const newApiError = createNewApiError({
      errorTitle: "Server is probably down!",
      errorMsg: "",
      statusCode: 500,
    });

    throw newApiError;
  }
};

/**
 * Function to make POST/UPDATE/DELETE Requests with error handling.
 *
 * The idea is to use a centralized function to execute POST/UPDATE/DELETE Requests
 * and not duplicate code all over the place.
 *
 * @param {Object} params - Mutation fn params.
 * @param {Object | undefined} params.payload - Payload requested by backend
 * @param {string} params.url - Backend URL
 * @param {string} params.method - HTTP method to execute (only for mutations)
 *
 */
export const mutationHttpRequest = async <Payload, Response>({
  payload,
  url,
  method,
}: {
  payload?: Payload;
  url: string;
  method: "DELETE" | "POST" | "UPDATE";
}): Promise<Response> => {
  try {
    const req = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: payload ? JSON.stringify(payload) : undefined,
      credentials: "include",
    });

    const rsp = (await req.json()) as ApiRsp<Response>;

    // Check if there's a server internal error, status code = 5xx
    if (rsp.statusCode >= 500) {
      const apiError = createNewApiError({
        errorTitle: "Algo ha salido mal !",
        errorMsg: rsp.message,
        statusCode: rsp.statusCode,
      });
      throw apiError;
    }
    // Check if user is unathorized, status code = 401
    if (rsp.statusCode === 401) {
      const apiError = createNewApiError({
        errorTitle: "Unauthorized",
        errorMsg: rsp.message,
        statusCode: rsp.statusCode,
      });
      throw apiError;
    }
    // Check is there was bad user input, status code = 4xx
    if (rsp.statusCode === 400) {
      const apiError = createNewApiError({
        errorTitle: "Bad input",
        errorMsg: rsp.message,
        statusCode: rsp.statusCode,
      });
      throw apiError;
    }

    return rsp.data;
  } catch (error) {
    const apiError = error as ApiError;
    console.error("HTTP Mutation Request went wrong: ", error);
    // If the error thrown has a "statusCode", it's a custome error
    if (apiError.statusCode) {
      throw apiError;
    }

    // Server is probably down
    const newApiError = createNewApiError({
      errorTitle: "Server is probably down!",
      errorMsg: "",
      statusCode: 500,
    });

    throw newApiError;
  }
};
