import * as React from "react"

export type Toast = {
  id?: string
  title?: string
  description?: string
  action?: React.ReactNode
  duration?: number
    variant?: "default" | "success" | "destructive" | "warning" | "info"

}

type ToastAction = Toast & {
  id: string
}

let listeners: ((toast: ToastAction) => void)[] = []

export function toast(toast: Toast) {
  const id = Math.random().toString(36).substring(2, 9)
  listeners.forEach((listener) => listener({ ...toast, id }))
}

export function useToast() {
  const [toasts, setToasts] = React.useState<ToastAction[]>([])

  React.useEffect(() => {
    const listener = (toast: ToastAction) => {
      setToasts((prev) => [...prev, toast])

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id))
      }, toast.duration || 3000)
    }

    listeners.push(listener)
    return () => {
      listeners = listeners.filter((l) => l !== listener)
    }
  }, [])

  return {
    toasts,
    toast,
  }
}
