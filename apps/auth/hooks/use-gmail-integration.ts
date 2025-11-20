"use client"

import { useCallback, useEffect, useState } from "react"
import { apiFetch } from "@/lib/api-client"

export interface GmailStatus {
  connected: boolean
  historyId?: string
  watchExpiration?: string
}

export const useGmailIntegration = () => {
  const [status, setStatus] = useState<GmailStatus>({ connected: false })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshStatus = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiFetch<GmailStatus>("/auth/google-gmail/status")
      setStatus({
        connected: Boolean(data?.connected),
        historyId: data?.historyId,
        watchExpiration: data?.watchExpiration,
      })
    } catch (err: any) {
      setError(err?.message || "Failed to fetch Gmail status")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshStatus()
  }, [refreshStatus])

  const connect = useCallback(
    async (code: string) => {
      setError(null)
      await apiFetch("/auth/google-gmail", {
        method: "POST",
        body: JSON.stringify({ code }),
      })
      await refreshStatus()
    },
    [refreshStatus]
  )

  const disconnect = useCallback(async () => {
    setError(null)
    await apiFetch("/auth/google-gmail", {
      method: "DELETE",
    })
    await refreshStatus()
  }, [refreshStatus])

  const startWatch = useCallback(async () => {
    setError(null)
    await apiFetch("/gmail/watch", {
      method: "POST",
    })
    await refreshStatus()
  }, [refreshStatus])

  return {
    status,
    loading,
    error,
    refreshStatus,
    connect,
    disconnect,
    startWatch,
  }
}
