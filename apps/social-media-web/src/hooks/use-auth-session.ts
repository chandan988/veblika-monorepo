import { authClient } from "@/lib/auth.client";
import { useEffect } from "react";
import { setAuthToken } from "@/utils/api";

/**
 * Custom hook to easily access userId and token from better-auth session
 * 
 * Extracts from session structure:
 * {
 *   data: {
 *     session: { token: "...", userId: "..." },
 *     user: { id: "692d7b14b183fc3f9a664d27", email: "...", name: "..." }
 *   }
 * }
 * 
 * Uses:
 * - userId: session.data.user.id (primary) or session.data.session.userId (fallback)
 * - token: session.data.session.token
 * 
 * Also updates the API client with the token for automatic inclusion in requests
 * 
 * @returns { userId: string | null, token: string | null, user: any | null, session: any | null, isAuthenticated: boolean }
 */
export function useAuthSession() {
  const session = authClient.useSession();
  
  // Extract data from session
  const sessionData = session?.data;
  
  // Get userId from user.id (primary - this is the better-auth user ID like "692d7b14b183fc3f9a664d27")
  // Fallback to session.userId if user.id is not available
  const userId = sessionData?.user?.id || sessionData?.session?.userId || null;
  
  // Get token from session.token
  const token = sessionData?.session?.token || null;
  
  // Get full user object
  const user = sessionData?.user || null;
  
  // Get full session object
  const sessionInfo = sessionData?.session || null;
  
  // Update API client with token, userId, and email whenever they change
  // This ensures all API requests automatically include the token and user info
  useEffect(() => {
    setAuthToken(token, userId, user?.email || null);
  }, [token, userId, user?.email]);
  
  return {
    userId,        // "692d7b14b183fc3f9a664d27" - from session.data.user.id
    token,         // "sbztJHMSXHHpYjV8hKSjnGhD6vWryNSq" - from session.data.session.token
    user,          // Full user object with email, name, etc.
    session: sessionInfo,  // Full session object
    isAuthenticated: !!userId && !!token,
    isLoading: session?.isPending || false,
    error: session?.error || null,
  };
}

