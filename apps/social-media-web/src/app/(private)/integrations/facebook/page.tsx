"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function FacebookIntegrationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const connected = searchParams.get("connected") === "1";
  const error = searchParams.get("error");

  // Redirect user to Facebook OAuth
  const handleConnectFacebook = () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    window.location.href = `${apiUrl}/api/facebook/auth`;
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
    <div className="p-10">
      <h1 className="text-2xl font-semibold mb-6">Facebook Integration</h1>

      {!connected && !error && (
        <>
          <p className="text-gray-600 mb-4">
            Connect your Facebook account:
          </p>
          <button
            onClick={handleConnectFacebook}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Connect Facebook
          </button>
        </>
      )}

      {connected && (
        <div style={{ textAlign: "center", padding: "40px 20px" }}>
          <p style={{ color: "green", fontSize: "18px", fontWeight: "bold" }}>
            Facebook connected successfully ✔
          </p>
          <p style={{ color: "gray", marginTop: "10px" }}>
            Redirecting to integrations page in 5 seconds...
          </p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
          Error: {error}
        </div>
      )}
    </div>
  );
}

export default function FacebookIntegrationPage() {
  return (
    <Suspense fallback={<div className="p-10 text-gray-600">Loading...</div>}>
      <FacebookIntegrationContent />
    </Suspense>
  );
}


