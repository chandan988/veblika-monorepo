class EventBus {
  private target: EventTarget

  constructor() {
    this.target = typeof window !== "undefined" ? new EventTarget() : ({} as EventTarget)
  }

  on<T>(type: string, listener: (payload: T) => void) {
    if (!this.target.addEventListener) return () => {}
    const wrapped = (event: Event) => listener((event as CustomEvent<T>).detail)
    this.target.addEventListener(type, wrapped as EventListener)
    return () => this.target.removeEventListener(type, wrapped as EventListener)
  }

  emit<T>(type: string, detail: T) {
    if (!this.target.dispatchEvent) return
    this.target.dispatchEvent(new CustomEvent(type, { detail }))
  }
}

export const eventBus = new EventBus()
