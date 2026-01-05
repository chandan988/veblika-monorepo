"use client";
import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, Eye, EyeOff } from "lucide-react";
import useSaveAppConfig from "@/lib/queries/appconfig/use-save-appConfig";
import { useAuthSession } from "@/hooks/use-auth-session";
import { toast } from "sonner";

interface CredentialsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appname: string;
  platformName: string;
  icon?: string;
  onCredentialsSaved?: () => void;
  onConnect?: () => void;
  existingConfig?: {
    appClientId?: string;
    appClientSecret?: string;
    redirectUrl?: string;
    source?: string;
  };
}

const PLATFORM_REDIRECT_URIS: Record<string, string> = {
  "app/instagram": "/api/instagram/callback",
  "app/facebook": "/api/facebook/callback",
  "app/linkedin": "/api/linkedin/callback",
  "app/youtube": "/api/youtube/callback",
};

export function CredentialsDialog({
  open,
  onOpenChange,
  appname,
  platformName,
  icon,
  onCredentialsSaved,
  onConnect,
  existingConfig,
}: CredentialsDialogProps) {
  // Only show custom credentials toggle if user has existing config in DB
  // If existingConfig is provided, it means user has saved credentials before
  const hasExistingConfig = !!existingConfig && existingConfig.source === "database";
  const [useCustomCredentials, setUseCustomCredentials] = React.useState(hasExistingConfig);
  const [clientId, setClientId] = React.useState(existingConfig?.appClientId || "");
  const [clientSecret, setClientSecret] = React.useState(existingConfig?.appClientSecret || "");
  const [redirectUrl, setRedirectUrl] = React.useState(
    existingConfig?.redirectUrl || ""
  );
  const [showSecret, setShowSecret] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const saveAppConfig = useSaveAppConfig();
  const { isAuthenticated, isLoading: isSessionLoading } = useAuthSession();

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const defaultRedirectUri = `${apiUrl}${PLATFORM_REDIRECT_URIS[appname] || ""}`;

  React.useEffect(() => {
    if (existingConfig && existingConfig.source === "database") {
      // Only pre-fill if config is from database (user's own credentials)
      setClientId(existingConfig.appClientId || "");
      setClientSecret(existingConfig.appClientSecret || "");
      setRedirectUrl(existingConfig.redirectUrl || "");
      setUseCustomCredentials(true);
    } else {
      // Set default redirect URI if not provided
      if (!redirectUrl) {
        setRedirectUrl(defaultRedirectUri);
      }
      // Don't enable custom credentials by default if no existing config
      setUseCustomCredentials(false);
    }
  }, [existingConfig, defaultRedirectUri]);

  const handleSave = async () => {
    // Check if user is authenticated
    if (isSessionLoading) {
      toast.error("Please wait, session is loading...");
      return;
    }

    if (!isAuthenticated) {
      toast.error("You must be logged in to save credentials. Please log in and try again.");
      return;
    }

    if (!useCustomCredentials) {
      // User wants to use platform credentials, just proceed with connection
      onOpenChange(false);
      if (onConnect) {
        onConnect();
      }
      return;
    }

    // Validate custom credentials
    if (!clientId.trim()) {
      toast.error("Client ID is required");
      return;
    }

    if (!clientSecret.trim()) {
      toast.error("Client Secret is required");
      return;
    }

    if (!redirectUrl.trim()) {
      toast.error("Redirect URI is required");
      return;
    }

    setIsSaving(true);
    try {
      await saveAppConfig.mutateAsync({
        data: {
          appname,
          clientId: clientId.trim(),
          clientSecret: clientSecret.trim(),
          redirectUrl: redirectUrl.trim(),
        },
      });

      toast.success(`${platformName} credentials saved successfully`);
      onOpenChange(false);
      
      if (onCredentialsSaved) {
        onCredentialsSaved();
      }
      
      // Proceed with connection after saving credentials
      if (onConnect) {
        // Small delay to ensure backend has processed the config
        setTimeout(() => {
          onConnect();
        }, 500);
      }
    } catch (error: any) {
      console.error("Error saving credentials:", error);
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to save credentials";
      toast.error(errorMessage);
      
      // If it's an authentication error, provide more helpful message
      if (error?.response?.status === 401) {
        toast.error("Authentication failed. Please refresh the page and try again.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {icon && (
              <img src={icon} className="h-6 w-6" alt={platformName} />
            )}
            {hasExistingConfig ? "Update" : "Configure"} {platformName} Credentials
          </DialogTitle>
          <DialogDescription>
            {hasExistingConfig
              ? "Update your OAuth credentials or connect without custom credentials."
              : "Optionally provide your own OAuth credentials to connect your account."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Toggle for custom credentials */}
          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
            <div className="space-y-0.5">
              <Label htmlFor="use-custom" className="text-base font-medium">
                Use My Own Credentials
              </Label>
              <p className="text-sm text-muted-foreground">
                Enable to use your own OAuth app credentials
              </p>
            </div>
            <Switch
              id="use-custom"
              checked={useCustomCredentials}
              onCheckedChange={setUseCustomCredentials}
            />
          </div>

          {useCustomCredentials && (
            <div className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Enter your OAuth app credentials from your {platformName}{" "}
                  developer console. These will be securely stored in your
                  account.
                </AlertDescription>
              </Alert>

              {/* Client ID */}
              <div className="space-y-2">
                <Label htmlFor="client-id">
                  Client ID <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="client-id"
                  placeholder="Enter your Client ID"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  disabled={isSaving}
                />
              </div>

              {/* Client Secret */}
              <div className="space-y-2">
                <Label htmlFor="client-secret">
                  Client Secret <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="client-secret"
                    type={showSecret ? "text" : "password"}
                    placeholder="Enter your Client Secret"
                    value={clientSecret}
                    onChange={(e) => setClientSecret(e.target.value)}
                    disabled={isSaving}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowSecret(!showSecret)}
                    disabled={isSaving}
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
                <Label htmlFor="redirect-uri">
                  Redirect URI <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="redirect-uri"
                  placeholder="Enter your Redirect URI"
                  value={redirectUrl}
                  onChange={(e) => setRedirectUrl(e.target.value)}
                  disabled={isSaving}
                />
                <p className="text-xs text-muted-foreground">
                  Default: {defaultRedirectUri}
                </p>
              </div>
            </div>
          )}

          {!useCustomCredentials && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                {hasExistingConfig
                  ? "You can connect without custom credentials. The connection will proceed with available settings."
                  : "You can connect without providing custom credentials. Click 'Connect' to proceed."}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving
              ? "Saving..."
              : useCustomCredentials
              ? "Save & Connect"
              : "Connect"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

