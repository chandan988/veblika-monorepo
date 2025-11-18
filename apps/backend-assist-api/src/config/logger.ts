import pino from "pino"
import pinoHttp from "pino-http"
import { config } from "./index"

const isDev = config.nodeEnv === "development"

const logger = pino({
  // config.logLevel is optional in the config shape; use a safe access to avoid TS errors
  level: (config as any).logLevel || (isDev ? "debug" : "info"),
  transport: isDev
    ? {
        target: "pino-pretty",
        options: { colorize: true, translateTime: "SYS:standard" },
      }
    : undefined,
})

// HTTP request logger middleware
// @ts-ignore
const httpLogger = pinoHttp({ logger })

export { logger, httpLogger }
