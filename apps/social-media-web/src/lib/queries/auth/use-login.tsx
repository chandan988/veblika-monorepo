import api from "@/utils/api";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { authClient } from "@/lib/auth.client";

const useLogin = (redirectTo?: string) => {
  const router = useRouter();
  const login = useMutation({
    mutationFn: async ({
      data,
    }: {
      data: { email: string; password: string };
    }) => {
       try {
        const result = await authClient.signIn.email({
          email: data.email,
          password: data.password,
          callbackURL: redirectTo || process.env.NEXT_PUBLIC_CLIENT_URL,
        });

        return { success: true, data: result };
      } catch (error) {
        // Extract error message from backend response
        const axiosError = error as AxiosError<{ message?: string; status?: boolean }>;
        const errorMessage = axiosError.response?.data?.message || "Login failed. Please try again.";
        
        // Show error toast immediately
        toast.error(errorMessage);
        
        // Return error result instead of throwing to prevent Next.js error overlay
        return { 
          success: false, 
          error: errorMessage,
          status: axiosError.response?.status 
        };
      }
    },
    onSuccess: (result) => {
      // Only proceed if login was successful
      if (result.success) {
        toast.success("Login successful");
        console.log("Login successful");
        router.replace("/");
      }
      // If result.success is false, error toast was already shown in mutationFn
    },
    // Prevent React Query from throwing unhandled errors to error boundaries
    throwOnError: false,
  });
  return login;
};

export default useLogin;
