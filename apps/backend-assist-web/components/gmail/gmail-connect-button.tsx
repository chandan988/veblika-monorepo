"use client"

import clsx from "clsx"
import { useGoogleLogin } from "@react-oauth/google"
import { toast } from "sonner"
import { useConnectGmail, useDisconnectGmail, useGmailStatus, useStartGmailWatch } from "@/hooks/use-gmail-status"

export const GmailConnectButton = () => {
  const { data, isLoading, isFetching } = useGmailStatus()
  const connectMutation = useConnectGmail()
  const disconnectMutation = useDisconnectGmail()
  const watchMutation = useStartGmailWatch()

  const isConnected = Boolean(data?.connected)

  const login = useGoogleLogin({
    flow: "auth-code",
    scope: "https://mail.google.com https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile",
    onSuccess: async (response) => {
      try {
        await connectMutation.mutateAsync(response.code)
        toast.success("Gmail linked successfully")
      } catch (err: any) {
        toast.error(err?.response?.data?.message || "Gmail connect failed")
      }
    },
    onError: () => toast.error("Gmail connect failed"),
  })

  const handleDisconnect = async () => {
    try {
      await disconnectMutation.mutateAsync()
      toast.success("Gmail disconnected")
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to disconnect Gmail")
    }
  }

  const handleWatch = async () => {
    try {
      await watchMutation.mutateAsync()
      toast.success("Gmail watch registered")
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to register Gmail watch")
    }
  }

  const connecting = connectMutation.isPending || isLoading || isFetching

  return (
    <div className="space-y-3 rounded-2xl border border-dashed border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">Gmail connector</p>
          <p className="text-xs text-slate-500">
            {isConnected ? "Incoming emails are ready to become tickets." : "Link your Gmail inbox to capture tickets."}
          </p>
        </div>
        <span
          className={clsx(
            "rounded-full px-2 py-0.5 text-xs font-semibold",
            isConnected ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
          )}
        >
          {isConnected ? "Connected" : "Not connected"}
        </span>
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => (isConnected ? handleDisconnect() : login())}
          className={clsx(
            "flex-1 rounded-md px-4 py-2 text-sm font-semibold text-white transition",
            isConnected ? "bg-rose-500 hover:bg-rose-600" : "bg-slate-900 hover:bg-slate-800",
            (connectMutation.isPending || disconnectMutation.isPending) && "opacity-60 cursor-not-allowed"
          )}
          disabled={connectMutation.isPending || disconnectMutation.isPending}
        >
          {isConnected ? "Disconnect Gmail" : connecting ? "Checking..." : "Connect Gmail"}
        </button>
        {isConnected ? (
          <button
            type="button"
            onClick={handleWatch}
            className={clsx(
              "rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50",
              watchMutation.isPending && "opacity-60 cursor-not-allowed"
            )}
            disabled={watchMutation.isPending}
          >
            {watchMutation.isPending ? "Starting..." : "Start Gmail watch"}
          </button>
        ) : null}
      </div>
      {data?.watchExpiration ? (
        <p className="text-xs text-slate-500">
          Watch expires {new Date(data.watchExpiration).toLocaleString()} &middot; history {data.historyId ?? "n/a"}
        </p>
      ) : null}
    </div>
  )
}
