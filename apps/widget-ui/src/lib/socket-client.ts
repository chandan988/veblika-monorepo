import { io, Socket } from "socket.io-client"

const SOCKET_URL =
  import.meta.env.VITE_BACKEND_API_URL || "http://localhost:8000"

let socket: Socket | null = null

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      path: "/api/ws",
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      withCredentials: true,
    })
  }
  return socket
}

export const connectSocket = (): Socket => {
  const socketInstance = getSocket()
  if (!socketInstance.connected) {
    socketInstance.connect()
  }
  return socketInstance
}

export const disconnectSocket = () => {
  if (socket?.connected) {
    socket.disconnect()
  }
}
