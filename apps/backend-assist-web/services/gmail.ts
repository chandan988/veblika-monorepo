import { api } from "./api"

export const gmailService = {
  connect: async (code: string) => {
    console.log("[gmailService.connect] Attempting to connect Gmail with auth code", code ? `${code.slice(0, 6)}...` : "undefined")
    const { data } = await api.post("/auth/google-gmail", { code })
    console.log("[gmailService.connect] Response", data)
    return data
  },
  disconnect: async () => {
    console.log("[gmailService.disconnect] Attempting to disconnect Gmail")
    const { data } = await api.delete("/auth/google-gmail")
    console.log("[gmailService.disconnect] Response", data)
    return data
  },
  getStatus: async () => {
    console.log("[gmailService.status] Fetching Gmail status")
    const { data } = await api.get("/auth/google-gmail/status")
    console.log("[gmailService.status] Response", data)
    return data as { connected: boolean; historyId?: string; watchExpiration?: string }
  },
  startWatch: async () => {
    console.log("[gmailService.watch] Requesting Gmail watch start")
    const { data } = await api.post("/gmail/watch")
    console.log("[gmailService.watch] Response", data)
    return data
  },
}
