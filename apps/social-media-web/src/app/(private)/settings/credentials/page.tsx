"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, Eye, EyeOff, Save } from "lucide-react";
import { toast } from "sonner";
import useSaveAppConfig from "@/lib/queries/appconfig/use-save-appConfig";
import useGetApps from "@/lib/queries/appconfig/use-get-apps";
import { useAuthSession } from "@/hooks/use-auth-session";
import { Spinner } from "@/components/ui/spinner";

const PLATFORMS = [
  {
    id: "app/instagram",
    name: "Instagram",
    icon: "/icons/instagram.png",
    redirectUri: "/api/instagram/callback",
  },
  {
    id: "app/facebook",
    name: "Facebook",
    icon: "/icons/facebook.png",
    redirectUri: "/api/facebook/callback",
  },
  {
    id: "app/linkedin",
    name: "LinkedIn",
    icon: "/icons/linkedin.png",
    redirectUri: "/api/linkedin/callback",
  },
  {
    id: "app/youtube",
    name: "YouTube",
    icon: "/icons/youtube.png",
    redirectUri: "/api/youtube/callback",
  },
];

export default function ManageCredentialsPage() {
  const { isAuthenticated, isLoading: isSessionLoading } = useAuthSession();
  const { data: appsData, isLoading: isLoadingApps, refetch } = useGetApps();
  const saveAppConfig = useSaveAppConfig();

  const [credentials, setCredentials] = React.useState<
    Record<string, { clientId: string; clientSecret: string; redirectUrl: string; useCustom: boolean }>
  >({});

  const [showSecrets, setShowSecrets] = React.useState<Record<string, boolean>>({});

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // Initialize credentials from backend data
  React.useEffect(() => {
    if (appsData?.data?.integrations) {
      const initialCredentials: typeof credentials = {};
      
      appsData.data.integrations.forEach((integration: any) => {
        const config = integration.config;
        // Only use config if it's from database (user's own credentials)
        if (config && config.source === "database") {
          initialCredentials[integration.appname] = {
            clientId: config.appClientId || "",
            clientSecret: config.appClientSecret || "",
            redirectUrl: config.redirectUrl || "",
            useCustom: true,
          };
        } else {
          // Set default redirect URI
          const platform = PLATFORMS.find((p) => p.id === integration.appname);
          initialCredentials[integration.appname] = {
            clientId: "",
            clientSecret: "",
            redirectUrl: platform ? `${apiUrl}${platform.redirectUri}` : "",
            useCustom: false,
          };
        }
      });

      // Also initialize platforms that might not be in backend response
      PLATFORMS.forEach((platform) => {
        if (!initialCredentials[platform.id]) {
          initialCredentials[platform.id] = {
            clientId: "",
            clientSecret: "",
            redirectUrl: `${apiUrl}${platform.redirectUri}`,
            useCustom: false,
          };
        }
      });

      setCredentials(initialCredentials);
    }
  }, [appsData, apiUrl]);

  const handleToggleCustom = (platformId: string) => {
    setCredentials((prev) => ({
      ...prev,
      [platformId]: {
        ...prev[platformId],
        useCustom: !prev[platformId]?.useCustom,
      },
    }));
  };

  const handleInputChange = (
    platformId: string,
    field: "clientId" | "clientSecret" | "redirectUrl",
    value: string
  ) => {
    setCredentials((prev) => ({
      ...prev,
      [platformId]: {
        ...prev[platformId],
        [field]: value,
      },
    }));
  };

  const handleSave = async (platformId: string) => {
    if (isSessionLoading) {
      toast.error("Please wait, session is loading...");
      return;
    }

    if (!isAuthenticated) {
      toast.error("You must be logged in to save credentials. Please log in and try again.");
      return;
    }

    const creds = credentials[platformId];
    if (!creds) {
      toast.error("Platform configuration not found");
      return;
    }

    if (!creds.useCustom) {
      toast.info("Custom credentials are disabled for this platform");
      return;
    }

    // Validate
    if (!creds.clientId.trim()) {
      toast.error("Client ID is required");
      return;
    }

    if (!creds.clientSecret.trim()) {
      toast.error("Client Secret is required");
      return;
    }

    if (!creds.redirectUrl.trim()) {
      toast.error("Redirect URI is required");
      return;
    }

    try {
      await saveAppConfig.mutateAsync({
        data: {
          appname: platformId,
          clientId: creds.clientId.trim(),
          clientSecret: creds.clientSecret.trim(),
          redirectUrl: creds.redirectUrl.trim(),
        },
      });

      toast.success(`${PLATFORMS.find((p) => p.id === platformId)?.name || platformId} credentials saved successfully`);
      refetch();
    } catch (error: any) {
      console.error("Error saving credentials:", error);
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to save credentials";
      toast.error(errorMessage);
    }
  };

  const toggleShowSecret = (platformId: string) => {
    setShowSecrets((prev) => ({
      ...prev,
      [platformId]: !prev[platformId],
    }));
  };

  if (isLoadingApps) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-100">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Manage App Credentials</h1>
          <p className="text-gray-600 mt-2">
            Configure OAuth credentials for your social media platforms. These credentials will be used when connecting your accounts.
          </p>
        </div>

        {/* Platforms Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {PLATFORMS.map((platform) => {
            const creds = credentials[platform.id] || {
              clientId: "",
              clientSecret: "",
              redirectUrl: `${apiUrl}${platform.redirectUri}`,
              useCustom: false,
            };
            const showSecret = showSecrets[platform.id] || false;

            return (
              <Card key={platform.id} className="border-gray-200">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <img
                      src={platform.icon}
                      alt={platform.name}
                      className="h-8 w-8"
                    />
                    <div className="flex-1">
                      <CardTitle>{platform.name}</CardTitle>
                      <CardDescription>
                        OAuth app credentials for {platform.name}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Toggle for custom credentials */}
                  <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
                    <div className="space-y-0.5">
                      <Label htmlFor={`use-custom-${platform.id}`} className="text-base font-medium">
                        Use My Own Credentials
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Enable to use your own OAuth app credentials
                      </p>
                    </div>
                    <Switch
                      id={`use-custom-${platform.id}`}
                      checked={creds.useCustom}
                      onCheckedChange={() => handleToggleCustom(platform.id)}
                    />
                  </div>

                  {creds.useCustom && (
                    <div className="space-y-4 pt-2">
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          Enter your OAuth app credentials from your {platform.name} developer console.
                        </AlertDescription>
                      </Alert>

                      {/* Client ID */}
                      <div className="space-y-2">
                        <Label htmlFor={`client-id-${platform.id}`}>
                          Client ID <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id={`client-id-${platform.id}`}
                          placeholder="Enter your Client ID"
                          value={creds.clientId}
                          onChange={(e) => handleInputChange(platform.id, "clientId", e.target.value)}
                          disabled={saveAppConfig.isPending}
                        />
                      </div>

                      {/* Client Secret */}
                      <div className="space-y-2">
                        <Label htmlFor={`client-secret-${platform.id}`}>
                          Client Secret <span className="text-destructive">*</span>
                        </Label>
                        <div className="relative">
                          <Input
                            id={`client-secret-${platform.id}`}
                            type={showSecret ? "text" : "password"}
                            placeholder="Enter your Client Secret"
                            value={creds.clientSecret}
                            onChange={(e) => handleInputChange(platform.id, "clientSecret", e.target.value)}
                            disabled={saveAppConfig.isPending}
                            className="pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => toggleShowSecret(platform.id)}
                            disabled={saveAppConfig.isPending}
                          >
                            {showSecret ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Redirect URI */}
                      <div className="space-y-2">
                        <Label htmlFor={`redirect-uri-${platform.id}`}>
                          Redirect URI <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id={`redirect-uri-${platform.id}`}
                          placeholder="Enter your Redirect URI"
                          value={creds.redirectUrl}
                          onChange={(e) => handleInputChange(platform.id, "redirectUrl", e.target.value)}
                          disabled={saveAppConfig.isPending}
                        />
                        <p className="text-xs text-muted-foreground">
                          Default: {`${apiUrl}${platform.redirectUri}`}
                        </p>
                      </div>

                      {/* Save Button */}
                      <Button
                        onClick={() => handleSave(platform.id)}
                        disabled={saveAppConfig.isPending || !creds.useCustom}
                        className="w-full gap-2"
                      >
                        {saveAppConfig.isPending ? (
                          <>
                            <Spinner />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4" />
                            Save Credentials
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                  {!creds.useCustom && (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        Platform default credentials will be used. Enable "Use My Own Credentials" to configure your own.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}


