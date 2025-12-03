"use client";
import { useEffect } from "react";

/**
 * Suppresses expected errors (like 400 login errors) from showing in Next.js error overlay
 */
export function ErrorSuppressor() {
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason;
      
      // Check if it's a handled error (marked with isHandled flag)
      if (error?.isHandled) {
        event.preventDefault();
        return;
      }
      
      // Check if it's an Axios error with 400 status from login endpoint
      if (error?.response?.status === 400) {
        const url = error?.config?.url || error?.request?.responseURL || "";
        if (url.includes("/user/login")) {
          // Prevent the error from showing in Next.js overlay
          event.preventDefault();
          console.log("Suppressed expected login error:", error.response?.data?.message);
          return;
        }
      }
      
      // Check if it's an Error object with isHandled property
      if (error instanceof Error && (error as any).isHandled) {
        event.preventDefault();
        return;
      }
    };

    // Also handle errors thrown synchronously
    const handleError = (event: ErrorEvent) => {
      const error = event.error;
      if (error?.isHandled || (error?.response?.status === 400 && error?.config?.url?.includes("/user/login"))) {
        event.preventDefault();
      }
    };

    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    window.addEventListener("error", handleError);

    return () => {
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
      window.removeEventListener("error", handleError);
    };
  }, []);

  return null;
}

