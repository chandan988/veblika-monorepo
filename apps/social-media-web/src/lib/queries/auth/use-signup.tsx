import api from "@/utils/api";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const useSignup = () => {
  const router = useRouter();
  const signup = useMutation({
    mutationFn: async ({
      data,
    }: {
      data: { full_name: string; email: string; password: string; gender: string };
    }) => {
      console.log("data in useSignup", data);
      const res = await api.post("/user/signup", data);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Signup successful");
      console.log("Signup successful");
      router.replace("/");
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || "Signup failed";
      toast.error(errorMessage);
      console.log("Signup failed", error);
    },
  });
  return signup;
};

export default useSignup;

