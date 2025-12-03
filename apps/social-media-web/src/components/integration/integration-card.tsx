"use client";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip } from "../ui/tooltip";
import { TooltipContent, TooltipTrigger } from "@radix-ui/react-tooltip";
import { toast } from "sonner";
import useGetConnectedAccounts from "@/lib/queries/appconfig/use-get-connected-accounts";
import { useAuthSession } from "@/hooks/use-auth-session";

export function IntegrationCard({
  name,
  description,
  icon,
  connected = false,
  appname,
  el,
  config,
}: {
  el: any;
  name: string;
  description: string;
  icon?: React.ReactNode;
  connected?: boolean;
  appname: string;
  config?: any;
}) {
  const { data: connectedAccountsData, isLoading: isLoadingAccounts } = useGetConnectedAccounts();
  const { userId } = useAuthSession();
  const connectedAccounts = connectedAccountsData?.data || {};
  const accountInfo = connectedAccounts[appname];
  const isPlatformManaged = config?.source === "env";

  // Always allow connection attempts - backend will handle authentication
  // Even if config is missing, user can still try to connect (backend may have env vars)
  const hasConfig = true;
  
  // Determine if connected - check both accountInfo and the connected prop
  const isConnected = accountInfo?.connected || connected || false;

  // -----------------------------
  // INSTAGRAM (Graph API)
  // -----------------------------
  const handleTheInstagram = React.useCallback(() => {
    // ALWAYS redirect to backend for Instagram Graph API
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const userIdParam = userId ? `?userId=${encodeURIComponent(userId)}` : "";
    window.location.href = `${apiUrl}/api/instagram/auth${userIdParam}`;
  }, [userId]);

  // -----------------------------
  // FACEBOOK (Pages API)
  // -----------------------------
  const handleTheFacebook = React.useCallback(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const userIdParam = userId ? `?userId=${encodeURIComponent(userId)}` : "";
    window.location.href = `${apiUrl}/api/facebook/auth${userIdParam}`;
  }, [userId]);

  // -----------------------------
  // LINKEDIN (OAuth)
  // -----------------------------
  const handleTheLinkedIn = React.useCallback(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const userIdParam = userId ? `?userId=${encodeURIComponent(userId)}` : "";
    window.location.href = `${apiUrl}/api/linkedin/auth${userIdParam}`;
  }, [userId]);

  // -----------------------------
  // YOUTUBE (OAuth)
  // -----------------------------
  const handleTheYouTube = React.useCallback(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const userIdParam = userId ? `?userId=${encodeURIComponent(userId)}` : "";
    window.location.href = `${apiUrl}/api/youtube/auth${userIdParam}`;
  }, [userId]);

  // -----------------------------
  // CONNECT HANDLER
  // -----------------------------
  const handleTheConnect = (integration: any) => {
    if (!integration) {
      toast.error("Integration error.");
      return;
    }

    const handlers: Record<string, (integration: any) => void> = {
      "app/instagram": handleTheInstagram,
      "app/facebook": handleTheFacebook,
      "app/linkedin": handleTheLinkedIn,
      "app/youtube": handleTheYouTube,
    };

    const handler = handlers[integration.appname];

    if (!handler) {
      toast.info("Integration coming soon.");
      return;
    }

    handler(integration);
  };

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 flex-shrink-0 rounded-md bg-muted/50 flex items-center justify-center">
            <img
              src={(icon as string) || "image.png"}
              className="h-10 w-10"
              alt={name}
            />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <div className="text-sm font-medium">{name}</div>

              {isPlatformManaged && (
                <Badge variant="secondary" className="text-[10px] uppercase">
                  Platform managed
                </Badge>
              )}
            </div>

            <div className="mt-1 text-xs text-muted-foreground">
              {description}
            </div>

            {/* Only show config warning if explicitly not configured and not platform managed */}
            {!config && !isPlatformManaged && (
              <p className="mt-2 text-xs text-muted-foreground">
                Platform credentials may need to be configured on the server.
              </p>
            )}

            {/* Show connected account info */}
            {accountInfo?.connected && (
              <div className="mt-3 p-2 bg-green-50 dark:bg-green-950/20 rounded-md border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2">
                  {accountInfo.profilePicture && (
                    <img
                      src={accountInfo.profilePicture}
                      alt={accountInfo.accountName}
                      className="w-6 h-6 rounded-full"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-green-900 dark:text-green-100 truncate">
                      {accountInfo.accountName}
                    </p>
                    {accountInfo.accountEmail && (
                      <p className="text-xs text-green-700 dark:text-green-300 truncate">
                        {accountInfo.accountEmail}
                      </p>
                    )}
                    {accountInfo.pages && accountInfo.pages.length > 1 && (
                      <p className="text-xs text-green-600 dark:text-green-400">
                        {accountInfo.pages.length} {name === "LinkedIn" ? "pages" : "accounts"} connected
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FOOTER SECTION */}
      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm">
          <Tooltip>
            <TooltipTrigger asChild>
              <img
                src={
                  accountInfo?.connected || connected ? "/icons/connected.png" : "/icons/disconnected.png"
                }
                className="h-10 w-10"
                alt=""
              />
            </TooltipTrigger>
            <TooltipContent className="bg-primary px-4 py-2 rounded-2xl ">
              <p className="text-xs text-white">
                {isConnected ? "Connected" : "Not connected"}
              </p>
            </TooltipContent>
          </Tooltip>
        </div>

        {!isConnected && (
          <div className="flex items-center gap-2">
            <Button
              onClick={() => handleTheConnect(el)}
              variant="ghost"
              className="border"
              size="sm"
              disabled={isLoadingAccounts}
            >
              {isLoadingAccounts ? "Loading..." : "Connect"}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

export default IntegrationCard;
