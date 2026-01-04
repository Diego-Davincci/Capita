/*
    React query configuration to handle API requests
*/
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import type { ReactNode } from "react";
import { toast } from "sonner";

const MAX_RETRIES = 1; // Amount of retries before throwing a 5xx error to the user
const HTTP_STATUS_TO_NOT_RETRY = [400, 401, 402, 403, 404]; // Do not

const queryClient = new QueryClient({
  defaultOptions: {
    // Default options for queries
    queries: {
      retryDelay: 1000 * 2, // Amount of time to wait before making the next request on retry 👉 2sec
      staleTime: 1000 * 60, // Amount of time before data is considered stale (meaning cosidered to get refetch) 👉 1min
      refetchOnWindowFocus: false, // Do not refetch when changing between tabs and then coming back to the website
      refetchOnMount: false, // Do not refetch when a component gets mounted
      retry: (failureCount, error) => {
        if (failureCount > MAX_RETRIES) {
          return false;
        }

        // If statusCode = 4xx, abort retry
        // @ts-ignore
        if (HTTP_STATUS_TO_NOT_RETRY.includes(error.statusCode)) {
          return false;
        }

        return true;
      },
    },
  },
  // Here we describe how to handle failed requests (GET), statusCode = 5xx
  queryCache: new QueryCache({
    onError: (error) => {
      // Server error
      // @ts-ignore
      if (error.statusCode >= 500) {
        toast.error(error.name, {
          description: error.message,
          duration: 1000000, // Crazy time to simulate
          action: {
            label: "Refresh",
            onClick: () => window.location.reload(),
          },
          position: "top-center",
        });
      }

      // User is not authorized, statusCode = 401
      // @ts-ignore
      if (error.statusCode === 401) {
        // TODO: we can refresh the user's window here to redirect to login page
      }
    },
  }),
});

const ReactQueryWrapper = ({ children }: { children: ReactNode }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools
        initialIsOpen={false}
        position="bottom"
        buttonPosition="bottom-left"
      />
    </QueryClientProvider>
  );
};

export default ReactQueryWrapper;
