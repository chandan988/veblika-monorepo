import { api } from "./api"

export const gmailService = {
  connect: async (code: string) => {
    const { data } = await api.post("/auth/google-gmail", { code })
    return data
  },
  disconnect: async () => {
    const { data } = await api.delete("/auth/google-gmail")
    return data
  },
  getStatus: async () => {
    const { data } = await api.get("/auth/google-gmail/status")
    return data as { connected: boolean; historyId?: string; watchExpiration?: string }
  },
  startWatch: async () => {
    const { data } = await api.post("/gmail/watch")
    return data
  },
}
