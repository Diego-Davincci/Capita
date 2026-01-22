import { useApiMutation } from "@/hooks";
import type { SellPost } from "../types";
import type { ApiRsp } from "@/types";
import { API_URL } from "@/lib/utils";

type Props = {
  payload: SellPost;
};

export const useSellPost = ({ payload }: Props) => {
  const { data, isPending, mutate } = useApiMutation<FormData, ApiRsp<any>>({
    method: "POST",
    url: `${API_URL}/posts`,
    formData: true,
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
