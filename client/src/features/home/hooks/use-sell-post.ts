import { useApiMutation } from "@/hooks";
import type { SellPost, SellPostRsp } from "../types";
import { API_URL } from "@/lib/utils";
import { FEED_QUERY_KEY } from "./use-feed-query";

type Props = {
  payload: SellPost;
  onSuccess: () => void;
};

/**
 * useSellPost — submits a new post to the feed via multipart/form-data.
 * Converts the SellPost JSON payload into FormData before sending to POST /posts.
 * After a successful post, invalidates the feed query so the new post surfaces
 * on the next refetch (high recency score).
 *
 * Test cases:
 * 1. Calls onSuccess callback after a successful POST response
 * 2. FormData includes all required fields (title, category, price, media)
 * 3. Optional description field is only appended when present
 * 4. isPending is true while the request is in-flight, false otherwise
 * 5. Does not call mutate if mutateSellPost is not invoked
 * 6. Invalidates feed query on success so the new post appears in the feed
 */
export const useSellPost = ({ payload, onSuccess }: Props) => {
  const { data, isPending, mutate } = useApiMutation<FormData, SellPostRsp>({
    method: "POST",
    url: `${API_URL}/posts`,
    formData: true,
    onSuccessFn: () => {
      onSuccess();
    },
    invalidateQueries: [[FEED_QUERY_KEY]],
  });

  const mutateSellPost = () => {
    // Convert from JSON to FormData
    const formData = new FormData();
    formData.append("title", payload.title);
    if (payload.description) {
      formData.append("description", payload.description);
    }
    formData.append("category", payload.category);
    formData.append("price", payload.price.toString());
    formData.append("media", payload.media);
    // Execute HTTP Request
    mutate({ payload: formData });
  };

  return { data, isPending, mutateSellPost };
};
