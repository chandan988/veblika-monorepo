import api from "@/utils/api";
import { useQuery } from "@tanstack/react-query";

const useGetConnectedAccounts = () => {
  const getConnectedAccounts = useQuery({
    queryKey: ["getConnectedAccounts"],
    queryFn: async () => {
      const res = await api.get("/appconfig/connected-accounts");
      return res.data;
    },
    refetchOnWindowFocus: false,
  });
  return getConnectedAccounts;
};

export default useGetConnectedAccounts;

