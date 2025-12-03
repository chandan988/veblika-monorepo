import api from "@/utils/api";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

const useSaveAppConfig = () => {
  const saveAppConfig = useMutation({
    mutationFn: async ({ data }: { data: any }) => {
      const res = await api.post("/appconfig/create", data);
      return res.data;
    },
    onSuccess: () => {
      toast.success("App Config saved successfully");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Something went wrong");
    },
  });
  return saveAppConfig;
};

export default useSaveAppConfig;
