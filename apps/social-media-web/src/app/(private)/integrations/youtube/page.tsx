"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, Suspense } from "react";

function YoutubeIntegrationContent() {
  const params = useSearchParams();
  const router = useRouter();
  const connected = params.get("connected") === "1";
  const error = params.get("error");

  const connectYouTube = () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    window.location.href = `${apiUrl}/api/youtube/auth`;
  };

  // Redirect to /integrations after 5 seconds when connected successfully
  useEffect(() => {
    if (connected && !error) {
      const timer = setTimeout(() => {
        router.push("/integrations");
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [connected, error, router]);

  return (
    <div style={{ padding: 24 }}>
      <h1>YouTube Integration</h1>

      {!connected && !error && (
        <>
          <p>Connect your YouTube account:</p>
          <button onClick={connectYouTube}>Connect YouTube</button>
        </>
      )}

      {connected && (
        <div style={{ textAlign: "center", padding: "40px 20px" }}>
          <p style={{ color: "green", fontSize: "18px", fontWeight: "bold" }}>
            YouTube connected successfully ✔
          </p>
          <p style={{ color: "gray", marginTop: "10px" }}>
            Redirecting to integrations page in 5 seconds...
          </p>
        </div>
      )}

      {error && <p style={{ color: "red" }}>Error: {error}</p>}
    </div>
  );
}

export default function YoutubeIntegration() {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Loading...</div>}>
      <YoutubeIntegrationContent />
    </Suspense>
  );
}
