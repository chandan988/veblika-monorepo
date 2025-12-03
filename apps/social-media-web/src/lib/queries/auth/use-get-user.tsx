import api from "@/utils/api";
import { useQuery } from "@tanstack/react-query";

const useGetUser = () => {
  const getUser = useQuery({
    queryKey: ["getUser"],
    queryFn: async () => {
      const res = await api.get("/user/profile");
      return res.data;
    },
    refetchOnWindowFocus: false,
  });
  return getUser;
};

export default useGetUser;

