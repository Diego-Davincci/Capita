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
        errorTitle: "No autorizado !",
        errorMsg: rsp.message,
        statusCode: rsp.statusCode,
      });
      throw apiError;
    }
    // Check if there was bad user input, status code = 400
    if (rsp.statusCode === 400) {
      const apiError = createNewApiError({
        errorTitle: "Mala petición !",
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
      errorTitle: "El servidor probablemente esta caido !",
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
 * @param {boolean | undefined} params.formData - Identify wether we will send JSON or FormData
 * @param {string} params.url - Backend URL
 * @param {string} params.method - HTTP method to execute (only for mutations)
 *
 */
export const mutationHttpRequest = async <Payload, Response>({
  payload,
  formData = false,
  url,
  method,
}: {
  payload?: Payload;
  formData?: boolean;
  url: string;
  method: "DELETE" | "POST" | "UPDATE";
}): Promise<Response> => {
  try {
    const formPayload = payload as FormData;

    const req = await fetch(url, {
      method,
      headers:
        payload && !formData
          ? {
              "Content-Type": "application/json",
            }
          : undefined,
      /*
          1 - If payload is provided, but formData is not, we're sending JSON
          2 - If payload is provided and formData is true, we're sending Form Data
          3 - default case, undefined, we're not sending anything
      */
      body:
        payload && !formData
          ? JSON.stringify(payload)
          : payload && formData
          ? formPayload
          : undefined,
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
        errorTitle: "No autorizado !",
        errorMsg: rsp.message,
        statusCode: rsp.statusCode,
      });
      throw apiError;
    }
    // Check is there was bad user input, status code = 4xx
    if (rsp.statusCode === 400) {
      const apiError = createNewApiError({
        errorTitle: "Mala petición !",
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
      errorTitle: "El servidor probablemente esta caido !",
      errorMsg: "",
      statusCode: 500,
    });

    throw newApiError;
  }
};
