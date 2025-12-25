import { defineConfig } from "vite"
// import react from "@vitejs/plugin-react"
import path from "path"

// https://vite.dev/config/
export default defineConfig({
  // plugins: [
  //   react(),
  //   {
  //     name: 'allow-all-iframes',
  //     configureServer: (server) => {
  //       server.middlewares.use((_, res, next) => {
  //         res.setHeader('X-Frame-Options', '')
  //         res.setHeader('Content-Security-Policy', "frame-ancestors * http://localhost:* https://localhost:*")
  //         next()
  //       })
  //     },
  //     configurePreviewServer: (server) => {
  //       server.middlewares.use((_, res, next) => {
  //         res.setHeader('X-Frame-Options', '')
  //         res.setHeader('Content-Security-Policy', "frame-ancestors * http://localhost:* https://localhost:*")
  //         next()
  //       })
  //     },
  //   },
  // ],
  // base: process.env.VITE_WIDGET_BASE_PATH || "/widget/",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@workspace/ui": path.resolve(__dirname, "../../packages/ui/src"),
    },
  },
})