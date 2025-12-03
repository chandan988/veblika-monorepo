"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import api from "@/utils/api";

function LinkedInIntegrationContent() {
  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState<any>(null);
  const searchParams = useSearchParams();
  const connected = searchParams.get("connected") === "1";
  const error = searchParams.get("error");

  // Fetch LinkedIn connection details
  const fetchDetails = async () => {
    try {
      const res = await api.get("/linkedin/profile");
      setDetails(res.data);
    } catch (err: any) {
      console.error("Error fetching LinkedIn details:", err);
      setDetails({ connected: false });
    } finally {
      setLoading(false);
    }
  };

  // Redirect user to LinkedIn OAuth
  const handleConnectLinkedIn = () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    window.location.href = `${apiUrl}/api/linkedin/auth`;
  };

  useEffect(() => {
    if (connected || error) {
      fetchDetails();
    } else {
      fetchDetails();
    }
  }, [connected, error]);

  if (loading) return <div className="p-10 text-gray-600">Loading...</div>;

  return (
    <div className="p-10">
      <h1 className="text-2xl font-semibold mb-6">LinkedIn Integration</h1>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
          Error: {error}
        </div>
      )}

      {connected && !error && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md text-green-700">
          Successfully connected to LinkedIn!
        </div>
      )}

      {/* ❌ If NOT connected */}
      {!details?.connected && (
        <>
          <p className="text-gray-600 mb-4">
            No LinkedIn account is connected yet.
          </p>

          <button
            onClick={handleConnectLinkedIn}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Connect LinkedIn
          </button>
        </>
      )}

      {/* ✅ If CONNECTED, show LinkedIn profile */}
      {details?.connected && details?.profile && (
        <div className="max-w-lg bg-white border rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Connected LinkedIn Account</h2>

          <div className="space-y-2 mb-4">
            <p className="font-semibold text-lg">{details.profile.name}</p>
            {details.profile.email && (
              <p className="text-gray-500 text-sm">{details.profile.email}</p>
            )}
          </div>

          {details.pages && details.pages.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold mb-2">Available Pages:</h3>
              <div className="space-y-2">
                {details.pages.map((page: any) => (
                  <div
                    key={page.pageId}
                    className="p-3 border rounded-md bg-gray-50"
                  >
                    <p className="font-medium">{page.pageName}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleConnectLinkedIn}
            className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Reconnect / Change Account
          </button>
        </div>
      )}
    </div>
  );
}

export default function LinkedInIntegrationPage() {
  return (
    <Suspense fallback={<div className="p-10 text-gray-600">Loading...</div>}>
      <LinkedInIntegrationContent />
    </Suspense>
  );
}


