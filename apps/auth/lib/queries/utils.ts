type ClientError = {
  message?: string
} | null

export function ensureNoClientError(error?: ClientError) {
  if (error) {
    throw new Error(error.message || "Something went wrong")
  }
}
