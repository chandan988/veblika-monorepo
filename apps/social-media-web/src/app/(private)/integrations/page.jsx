"use client";

import IntegrationCard from "@/components/integration/integration-card";
import IntegrationCardSkeleton from "@/components/integration/integration-card-skeleton";
import useGetApps from "@/lib/queries/appconfig/use-get-apps";
import useGetConnectedAccounts from "@/lib/queries/appconfig/use-get-connected-accounts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Search, Filter, MoreVertical, Settings } from "lucide-react";
import { useMemo, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

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
    icon: "/icons/facebook.png",
    description:
      "Manage Meta pages, publish carousels, and track engagement insights without leaving the dashboard.",
  },
  {
    id: 3,
    name: "LinkedIn",
    appname: "app/linkedin",
    icon: "/icons/linkedin.png",
    description:
      "Share professional content, engage with your network, and grow your business presence on LinkedIn.",
  },
  {
    id: 4,
    name: "YouTube",
    appname: "app/youtube",
    icon: "/icons/youtube.png",
    description:
      "Upload videos, manage your channel, and engage with your audience on the world's largest video platform.",
  },
];

function IntegrationsPageContent() {
  const { data, isLoading, isError, refetch } = useGetApps();
  const { refetch: refetchConnectedAccounts } = useGetConnectedAccounts();
  const searchParams = useSearchParams();
  const router = useRouter();
  
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
        // Only pass config if it's from database (user's own credentials), not from env
        const userConfig = backendData.config?.source === "database" 
          ? backendData.config 
          : null;
        
        // Merge backend data with default, keeping default values as fallback
        return {
          ...defaultIntegration,
          ...backendData,
          // Ensure we keep default values if backend doesn't provide them
          name: backendData.name || defaultIntegration.name,
          description: backendData.description || defaultIntegration.description,
          icon: backendData.icon || defaultIntegration.icon,
          // Only pass user's own config, not env-based config
          config: userConfig,
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
      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Integrations</h1>
          <p className="text-sm text-muted-foreground">
            Configure and manage your app integrations
          </p>
        </div>
        {/* <Button
          variant="outline"
          onClick={() => router.push("/settings/credentials")}
          className="gap-2"
        >
          <Settings className="h-4 w-4" />
          Manage Credentials
        </Button> */}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="flows">Flows</TabsTrigger>
          <TabsTrigger value="flows2">Flows</TabsTrigger>
          <TabsTrigger value="flows3">Flows</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Search and Filter Bar */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                className="pl-9"
              />
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>

          {isError && (
            <div className="rounded-md border border-destructive bg-destructive/5 px-4 py-3 text-sm text-destructive">
              Unable to load integration status. You can still connect to platforms below.
            </div>
          )}

          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 9 }).map((_, idx) => (
                <IntegrationCardSkeleton key={idx} />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
        </TabsContent>

        <TabsContent value="flows" className="mt-6">
          <p className="text-muted-foreground">Flows content coming soon</p>
        </TabsContent>

        <TabsContent value="flows2" className="mt-6">
          <p className="text-muted-foreground">Flows content coming soon</p>
        </TabsContent>

        <TabsContent value="flows3" className="mt-6">
          <p className="text-muted-foreground">Flows content coming soon</p>
        </TabsContent>
      </Tabs>
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


