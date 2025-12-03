import api from "@/utils/api";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const useLogout = () => {
  const router = useRouter();
  const logout = useMutation({
    mutationFn: async () => {
      const res = await api.post("/user/logout");
      return res.data;
    },
    onSuccess: () => {
      console.log("Logged out successfully");
      toast.success("Logged out successfully");
      router.push("/login");
    },
    onError: () => {
      toast.error("Error logging out. Please try again.");
    },
  });
  return logout;
};

export default useLogout;
