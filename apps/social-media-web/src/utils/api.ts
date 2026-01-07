import axios from "axios";
import { authClient } from "@/lib/auth.client";

// Ensure baseURL always ends with /api
const getBaseURL = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  // Remove trailing slash if present
  const cleanUrl = envUrl.replace(/\/$/, "");
  // Add /api if not already present
  return cleanUrl.endsWith("/api") ? cleanUrl : `${cleanUrl}/api`;
};

const api = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true,
});

// Store session data globally for use in interceptors
let currentSessionToken: string | null = null;
let currentUserId: string | null = null;
let currentUserEmail: string | null = null;
let currentUserRole: string | null = null;
let currentResellerId: string | null = null;

// Function to update session token and user data (called from components using the hook)
export const setAuthToken = (
  token: string | null, 
  userId: string | null, 
  userEmail?: string | null,
  userRole?: string | null,
  resellerId?: string | null
) => {
  currentSessionToken = token;
  currentUserId = userId;
  currentUserEmail = userEmail || null;
  currentUserRole = userRole || null;
  currentResellerId = resellerId || null;
};

// Helper to get session synchronously (with retry)
let sessionLoadPromise: Promise<void> | null = null;

const ensureSessionLoaded = async (): Promise<void> => {
  if (currentSessionToken && currentUserId) {
    return; // Already loaded
  }
  
  if (sessionLoadPromise) {
    return sessionLoadPromise; // Wait for ongoing load
  }
  
  sessionLoadPromise = (async () => {
    try {
      const { authClient } = await import("@/lib/auth.client");
      
      // Try to get session - better-auth/react uses hooks, so we need to wait
      // For now, we'll poll or wait a bit for the session to be available
      // The useAuthSession hook in the layout should set it, but there might be a race condition
      
      // Wait a bit for session to load (layout should have called useAuthSession)
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Check if session is now available in global state
      if (!currentSessionToken || !currentUserId) {
        // Session still not loaded, this might be a race condition
        // The backend will handle it via cookie
        console.log("Session not yet loaded in interceptor, backend will use cookie");
      }
    } catch (error) {
      console.log("Error ensuring session loaded:", error);
    } finally {
      sessionLoadPromise = null;
    }
  })();
  
  return sessionLoadPromise;
};

// Add request interceptor to include better-auth token in requests
api.interceptors.request.use(
  async (config) => {
    // Ensure session is loaded before making request
    await ensureSessionLoaded();
    
    // Use stored token from global state
    if (currentSessionToken) {
      // Add token as Authorization header
      config.headers.Authorization = `Bearer ${currentSessionToken}`;
      // Also add as a custom header for backend compatibility
      config.headers["X-Auth-Token"] = currentSessionToken;
      // Add userId header if available
      if (currentUserId) {
        config.headers["X-User-Id"] = currentUserId;
      }
      // Add user email if available (for user lookup fallback)
      if (currentUserEmail) {
        config.headers["X-User-Email"] = currentUserEmail;
      }
      // Add user role if available
      if (currentUserRole) {
        config.headers["X-User-Role"] = currentUserRole;
      }
      // Add resellerId if available
      if (currentResellerId) {
        config.headers["X-Reseller-Id"] = currentResellerId;
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle 401 errors (unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // User is not authenticated, redirect to login
      if (typeof window !== "undefined") {
        // Clear any existing cookies
        document.cookie = "automation=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=none";
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export const ImageApi = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true,
  // Don't set Content-Type header - let axios set it automatically with boundary for multipart/form-data
});

// Add request interceptor to ImageApi to include better-auth token
ImageApi.interceptors.request.use(
  async (config) => {
    // Use stored token from global state
    if (currentSessionToken) {
      config.headers.Authorization = `Bearer ${currentSessionToken}`;
      config.headers["X-Auth-Token"] = currentSessionToken;
      if (currentUserId) {
        config.headers["X-User-Id"] = currentUserId;
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to ImageApi as well
ImageApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // User is not authenticated, redirect to login
      if (typeof window !== "undefined") {
        // Clear any existing cookies
        document.cookie = "automation=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=none";
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
