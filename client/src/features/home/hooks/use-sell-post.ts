import { useApiMutation } from "@/hooks";
import type { FeedPosts, SellPost, SellPostRsp } from "../types";
import { API_URL } from "@/lib/utils";
import { useStore } from "@/store";

type Props = {
  payload: SellPost;
  onSuccess: () => void;
};

/**
 * useSellPost — submits a new post to the feed via multipart/form-data.
 * Converts the SellPost JSON payload into FormData before sending to POST /posts.
 *
 * Test cases:
 * 1. Calls onSuccess callback after a successful POST response
 * 2. FormData includes all required fields (title, category, price, media)
 * 3. Optional description field is only appended when present
 * 4. isPending is true while the request is in-flight, false otherwise
 * 5. Does not call mutate if mutateSellPost is not invoked
 */
export const useSellPost = ({ payload, onSuccess }: Props) => {
  const queryKey = [`feed-category`];
  const user = useStore((store) => store.user);

  const { data, isPending, mutate } = useApiMutation<FormData, SellPostRsp>({
    method: "POST",
    url: `${API_URL}/posts`,
    formData: true,
    onSuccessFn: () => {
      onSuccess();
    },
    updateCache: {
      queryKey,
      updater: (oldData, rsp, _) => {
        const newPost: FeedPosts = {
          ...rsp,
          username: user.username,
          userPicture: user.picture,
          phoneNumber: user.phoneNumber,
          shopName: user.shopName,
          shopDescription: user.shopDescription,
        };

        let currentHomeFeedData = oldData as FeedPosts[];

        currentHomeFeedData = [{ ...newPost }, ...oldData];

        return currentHomeFeedData;
      },
    },
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
