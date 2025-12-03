import api from "@/utils/api";
import { useMutation, useQuery } from "@tanstack/react-query";

const useGetApps = () => {
  const getApps = useQuery({
    queryKey: ["getApps"],
    queryFn: async () => {
      const res = await api.get("/appconfig/apps");
      return res.data;
    },
    refetchOnWindowFocus: false,
  });
  return getApps;
};

export default useGetApps;
