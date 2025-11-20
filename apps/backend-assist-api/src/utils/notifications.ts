import { EventEmitter } from "events"

export const notifications = new EventEmitter()

export type NotificationPayload = {
  type: string
  userId?: string
  [key: string]: any
}
