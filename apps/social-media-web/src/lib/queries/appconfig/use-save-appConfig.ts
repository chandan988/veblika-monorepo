import api from "@/utils/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const useSaveAppConfig = () => {
  const queryClient = useQueryClient();
  const saveAppConfig = useMutation({
    mutationFn: async ({ data }: { data: any }) => {
      const res = await api.post("/appconfig/create", data);
      return res.data;
    },
    onSuccess: () => {
      toast.success("App Config saved successfully");
      // Invalidate and refetch apps to get updated config
      queryClient.invalidateQueries({ queryKey: ["getApps"] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error?.message || "Something went wrong");
    },
  });
  return saveAppConfig;
};

export default useSaveAppConfig;
