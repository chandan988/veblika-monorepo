const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8001/api/v1").replace(/\/$/, "")

type ApiOptions = RequestInit & {
  skipJson?: boolean
}

export async function apiFetch<T = any>(path: string, options: ApiOptions = {}) {
  const { skipJson, headers, ...rest } = options
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    ...rest,
  })

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`
    try {
      const errorBody = await response.json()
      message = errorBody?.message || message
    } catch {
      // ignore json parsing issues
    }
    throw new Error(message)
  }

  if (skipJson || response.status === 204) {
    return null as T
  }

  return (await response.json()) as T
}

export const apiConfig = {
  baseUrl: API_BASE_URL,
}
