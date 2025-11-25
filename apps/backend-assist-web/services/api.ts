import axios from "axios"

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "/api",
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  const { method, url, baseURL } = config
  const marker = `[api-request] ${method?.toUpperCase()} ${baseURL || ""}${url}`
  console.log(marker, { data: config.data, params: config.params, headers: config.headers })
  ;(config as any)._requestStartedAt = Date.now()
  return config
})

api.interceptors.response.use(
  (response) => {
    const started = (response.config as any)._requestStartedAt
    const duration = started ? `${Date.now() - started}ms` : "n/a"
    const marker = `[api-response] ${response.config.method?.toUpperCase()} ${response.config.url}`
    console.log(marker, { status: response.status, duration, data: response.data })
    return response
  },
  (error) => {
    const cfg = error.config || {}
    const marker = `[api-error] ${cfg.method?.toUpperCase() || "UNKNOWN"} ${cfg.url || ""}`
    const started = (cfg as any)._requestStartedAt
    const duration = started ? `${Date.now() - started}ms` : "n/a"
    const status = error.response?.status
    const data = error.response?.data
    console.error(marker, { status, duration, data, message: error.message })
    return Promise.reject(error)
  }
)
