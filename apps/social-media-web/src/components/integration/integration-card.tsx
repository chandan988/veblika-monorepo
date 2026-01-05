"use client";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, CheckCircle2, LogOut, Mail, User } from "lucide-react";
import { toast } from "sonner";
import useGetConnectedAccounts from "@/lib/queries/appconfig/use-get-connected-accounts";
import { useAuthSession } from "@/hooks/use-auth-session";
import api from "@/utils/api";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

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
  const { data: connectedAccountsData, isLoading: isLoadingAccounts, refetch: refetchConnectedAccounts } = useGetConnectedAccounts();
  const { userId } = useAuthSession();
  const queryClient = useQueryClient();
  const router = useRouter();
  const connectedAccounts = connectedAccountsData?.data || {};
  const accountInfo = connectedAccounts[appname];
  const isPlatformManaged = config?.source === "env";
  const [isManageDialogOpen, setIsManageDialogOpen] = React.useState(false);
  const [isDisconnecting, setIsDisconnecting] = React.useState(false);

  // Always allow connection attempts - backend will handle authentication
  // Even if config is missing, user can try to connect (backend may have env vars)
  const hasConfig = true;
  
  // Determine if connected - check both accountInfo and the connected prop
  const isConnected = accountInfo?.connected || connected || false;

  // Platform info mapping
  const PLATFORM_INFO: Record<string, { name: string; icon: string }> = {
    "app/instagram": { name: "Instagram", icon: "/icons/instagram.png" },
    "app/facebook": { name: "Facebook", icon: "/icons/facebook.png" },
    "app/linkedin": { name: "LinkedIn", icon: "/icons/linkedin.png" },
    "app/youtube": { name: "YouTube", icon: "/icons/youtube.png" },
  };

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

  const handleManage = () => {
    if (!isConnected) {
      toast.error("Please connect your account first");
      return;
    }
    setIsManageDialogOpen(true);
  };

  const handleDisconnect = async () => {
    if (!isConnected) {
      toast.error("Account is not connected");
      return;
    }

    setIsDisconnecting(true);
    try {
      const response = await api.delete("/appconfig/disconnect", {
        data: { platform: appname },
      });

      if (response.data.status) {
        toast.success(`${PLATFORM_INFO[appname]?.name || name} disconnected successfully`);
        setIsManageDialogOpen(false);
        // Refresh connected accounts
        queryClient.invalidateQueries({ queryKey: ["getConnectedAccounts"] });
        refetchConnectedAccounts();
      } else {
        toast.error(response.data.message || "Failed to disconnect");
      }
    } catch (error: any) {
      console.error("Error disconnecting:", error);
      toast.error(error?.response?.data?.message || "Failed to disconnect account");
    } finally {
      setIsDisconnecting(false);
    }
  };

  return (
    <Card className="p-6 relative">
      {/* Three dots menu in top-right */}
      <div className="absolute top-4 right-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuItem>Disconnect</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Icon */}
      <div className="flex items-center justify-start">
        <div className="h-12 w-12 flex-shrink-0 flex items-center justify-center">
          <img
            src={(icon as string) || "image.png"}
            className="h-10 w-10"
            alt={name}
          />
        </div>
        <h3 className="text-lg font-semibold mb-2 ml-4">{name}</h3>
      </div>

      {/* Title */}
      

      {/* Description */}
      <p className="text-sm text-muted-foreground line-clamp-3">
        {description}
      </p>

      {/* Status Badge */}
      <div className="">
        {isConnected ? (
          <Badge className="bg-green-500/10 text-green-700"><CheckCircle2 className="h-3 w-3" />Connected</Badge>
        ) : (
          <Badge variant="outline">Not Connected</Badge>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleManage}
          className="flex-1"
          disabled={!isConnected}
        >
          Manage
        </Button>
        <Button
          onClick={() => handleTheConnect(el)}
          variant="default"
          size="sm"
          disabled={isLoadingAccounts || isConnected}
          className="flex-1 bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoadingAccounts ? "Loading..." : isConnected ? "Connected" : "Connect"}
        </Button>
      </div>

      {/* Manage Dialog */}
      <Dialog open={isManageDialogOpen} onOpenChange={setIsManageDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <img
                src={PLATFORM_INFO[appname]?.icon || (icon as string) || "image.png"}
                className="h-6 w-6"
                alt={name}
              />
              {PLATFORM_INFO[appname]?.name || name} Account
            </DialogTitle>
            <DialogDescription>
              View and manage your connected account details
            </DialogDescription>
          </DialogHeader>

          {accountInfo && (
            <div className="space-y-4 py-4">
              {/* Account Profile */}
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage
                    src={
                      accountInfo.profilePicture ||
                      accountInfo.profile_picture ||
                      accountInfo.thumbnail ||
                      undefined
                    }
                    alt={accountInfo.accountName || name}
                  />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {accountInfo.accountName?.charAt(0).toUpperCase() || name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">
                    {accountInfo.accountName || "Connected Account"}
                  </h3>
                  {accountInfo.accountEmail && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <Mail className="h-4 w-4" />
                      {accountInfo.accountEmail}
                    </div>
                  )}
                  {accountInfo.accountId && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <User className="h-3 w-3" />
                      ID: {accountInfo.accountId}
                    </div>
                  )}
                </div>
                <Badge className="bg-green-500/10 text-green-700">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
              </div>

              <Separator />

              {/* Additional Info */}
              {accountInfo.pages && accountInfo.pages.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Connected Pages</h4>
                  <div className="space-y-2">
                    {accountInfo.pages.slice(0, 3).map((page: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 rounded-md bg-muted/50"
                      >
                        <span className="text-sm">{page.pageName || page.name || `Page ${index + 1}`}</span>
                        {page.pageId && (
                          <span className="text-xs text-muted-foreground">{page.pageId}</span>
                        )}
                      </div>
                    ))}
                    {accountInfo.pages.length > 3 && (
                      <p className="text-xs text-muted-foreground">
                        +{accountInfo.pages.length - 3} more pages
                      </p>
                    )}
                  </div>
                </div>
              )}

              {accountInfo.subscriberCount && (
                <div className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                  <span className="text-sm font-medium">Subscribers</span>
                  <span className="text-sm">{accountInfo.subscriberCount.toLocaleString()}</span>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setIsManageDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              Close
            </Button>
            <Button
              variant="destructive"
              onClick={handleDisconnect}
              disabled={isDisconnecting}
              className="w-full sm:w-auto"
            >
              {isDisconnecting ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Disconnecting...
                </>
              ) : (
                <>
                  <LogOut className="h-4 w-4 mr-2" />
                  Disconnect
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default IntegrationCard;
