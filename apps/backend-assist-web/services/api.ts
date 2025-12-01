import axios from "axios"

if (!process.env.NEXT_PUBLIC_AUTH_URL) {
  throw new Error("NEXT_PUBLIC_AUTH_URL is not defined")
}

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_AUTH_URL + "/api/v1",
  withCredentials: true,
})
