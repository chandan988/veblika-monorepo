"use client";

import IntegrationCard from "@/components/integration/integration-card";
import IntegrationCardSkeleton from "@/components/integration/integration-card-skeleton";
import useGetApps from "@/lib/queries/appconfig/use-get-apps";
import useGetConnectedAccounts from "@/lib/queries/appconfig/use-get-connected-accounts";
import { Button } from "@/components/ui/button";
import { useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

// Default integrations that should always be shown
const DEFAULT_INTEGRATIONS = [
  {
    id: 1,
    name: "Instagram",
    appname: "app/instagram",
    icon: "/icons/instagram.png",
    description:
      "Schedule reels, reply to DMs, and keep your community engaged with creator-first workflows.",
  },
  {
    id: 2,
    name: "Facebook Pages",
    appname: "app/facebook",
    icon: "/icons/facebook.svg",
    description:
      "Manage Meta pages, publish carousels, and track engagement insights without leaving the dashboard.",
  },
  {
    id: 3,
    name: "LinkedIn",
    appname: "app/linkedin",
    icon: "https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png",
    description:
      "Share professional content, engage with your network, and grow your business presence on LinkedIn.",
  },
  {
    id: 4,
    name: "YouTube",
    appname: "app/youtube",
    icon: "https://upload.wikimedia.org/wikipedia/commons/4/42/YouTube_icon_%282013-2017%29.png",
    description:
      "Upload videos, manage your channel, and engage with your audience on the world's largest video platform.",
  },
];

function IntegrationsPageContent() {
  const { data, isLoading, isError, refetch } = useGetApps();
  const { refetch: refetchConnectedAccounts } = useGetConnectedAccounts();
  const searchParams = useSearchParams();
  
  // Refresh connected accounts when redirected from OAuth (e.g., ?linkedin=connected)
  useEffect(() => {
    const linkedinConnected = searchParams.get("linkedin");
    const instagramConnected = searchParams.get("instagram");
    const facebookConnected = searchParams.get("facebook");
    const youtubeConnected = searchParams.get("youtube");
    
    if (linkedinConnected || instagramConnected || facebookConnected || youtubeConnected) {
      // Refresh connected accounts to show updated status
      refetchConnectedAccounts();
      refetch();
    }
  }, [searchParams, refetchConnectedAccounts, refetch]);

  // Merge backend data with default integrations
  // Always show default integrations, but enhance them with backend data if available
  const integrations = useMemo(() => {
    const backendIntegrations = data?.data?.integrations ?? [];
    
    // Create a map of backend integrations by appname for quick lookup
    const backendMap = new Map(
      backendIntegrations.map((integration) => [integration.appname, integration])
    );

    // Merge default integrations with backend data
    return DEFAULT_INTEGRATIONS.map((defaultIntegration) => {
      const backendData = backendMap.get(defaultIntegration.appname);
      
      if (backendData) {
        // Merge backend data with default, keeping default values as fallback
        return {
          ...defaultIntegration,
          ...backendData,
          // Ensure we keep default values if backend doesn't provide them
          name: backendData.name || defaultIntegration.name,
          description: backendData.description || defaultIntegration.description,
          icon: backendData.icon || defaultIntegration.icon,
        };
      }
      
      // If no backend data, return default with default connection status
      return {
        ...defaultIntegration,
        connected: false,
        config: null,
      };
    });
  }, [data]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-2">
        <div>
          <h1 className="text-2xl font-semibold">Integrations</h1>
          <p className="text-sm text-muted-foreground">
            Connect your social accounts and manage them from a single dashboard.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
            Refresh
          </Button>
        </div>
      </div>

      {isError && (
        <div className="rounded-md border border-destructive bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Unable to load integration status. You can still connect to platforms below.
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, idx) => (
            <IntegrationCardSkeleton key={idx} />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {integrations.map((integration) => (
            <IntegrationCard
              key={integration.id}
              name={integration.name}
              description={integration.description}
              icon={integration.icon}
              connected={integration.connected ?? false}
              appname={integration.appname}
              el={integration}
              config={integration.config}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function IntegrationsPage() {
  return (
    <Suspense fallback={
      <div className="space-y-6 p-6">
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, idx) => (
            <IntegrationCardSkeleton key={idx} />
          ))}
        </div>
      </div>
    }>
      <IntegrationsPageContent />
    </Suspense>
  );
}


