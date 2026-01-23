import { useApiMutation } from "@/hooks";
import type { SellPost } from "../types";
import type { ApiRsp } from "@/types";
import { API_URL } from "@/lib/utils";

type Props = {
  payload: SellPost;
  onSuccess: () => void;
};

export const useSellPost = ({ payload, onSuccess }: Props) => {
  const { data, isPending, mutate } = useApiMutation<
    FormData,
    ApiRsp<undefined>
  >({
    method: "POST",
    url: `${API_URL}/posts`,
    formData: true,
    onSuccessFn: () => {
      onSuccess();
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
