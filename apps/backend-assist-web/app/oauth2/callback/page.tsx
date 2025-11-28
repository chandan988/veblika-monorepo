"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function OAuthCallbackPage() {
  const searchParams = useSearchParams();

  useEffect(() => {
    // Extract all search parameters
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });

    console.log("OAuth callback params:", params);

    // Send data to opener window via postMessage
    if (window.opener) {
      window.opener.postMessage(params, "*");
      
      // Close the popup window after sending data
      setTimeout(() => {
        window.close();
      }, 500);
    } else {
      console.error("No opener window found");
    }
  }, [searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Processing OAuth callback...</p>
        <p className="text-sm text-muted-foreground mt-2">
          This window will close automatically
        </p>
      </div>
    </div>
  );
}
