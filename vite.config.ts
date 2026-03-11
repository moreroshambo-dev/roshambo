import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import hercules from "@usehercules/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import { ngrok } from 'vite-plugin-ngrok'

// https://vite.dev/config/
export default defineConfig({
  preview: {
    proxy: {
      "/api": {
        target: process.env.VITE_CONVEX_URL,
        changeOrigin: true,
        ws: true
      }
    }
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    allowedHosts: true,
    hmr: {
      overlay: false,
    },
    proxy: {
      "/api": {
        target: 'http://127.0.0.1:3210',
        changeOrigin: true,
        ws: true,
        rewriteWsOrigin: true,
      },
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    ngrok('33i9oLcstfcRsvBGNnvEzSBIOpt_83EbuHNk22jmc4GhnMgG2'),
  ],
  resolve: {
    alias: {
      "@/convex": path.resolve(__dirname, "./convex"),
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
  },
});
