import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
// import hercules from "@usehercules/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig, loadEnv } from "vite";
import { ngrok } from 'vite-plugin-ngrok'
import browserEcho from '@browser-echo/vite';

// https://vite.dev/config/
export default defineConfig(({mode, command}) => {
  const envDir = path.resolve(__dirname, "../.."); // если .env лежит в корне репы
  const env = loadEnv(mode, envDir, "");
  
  return {
    root: __dirname,
    preview: {
      proxy: {
        "/api": {
          target: env.VITE_CONVEX_URL,
          changeOrigin: true,
          ws: true
        },
        "/.well-known": {
          target: env.VITE_CONVEX_SITE_URL,
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
          target: env.VITE_CONVEX_URL,
          changeOrigin: true,
          ws: true,
          rewriteWsOrigin: true,
        },
        "/.well-known": {
          target: env.VITE_CONVEX_SITE_URL,
          changeOrigin: true,
          ws: true,
        },
      },
    },
    plugins: [
      react(),
      browserEcho({
        colors: true,
        networkLogs: {
          enabled: true,
          bodies: {
      request: true,
      response: true,
      maxBytes: 2048,
      allowContentTypes: ['application/json','text/','application/x-www-form-urlencoded'],
      prettyJson: true
    }
        }
      }),
      tailwindcss(),
      ngrok({
        domain: 'rps.ngrok.dev',
        authtoken: env.NGROK_AUTH_TOKEN,
      }),
    ],
    resolve: {
      alias: {
        "@/convex": path.resolve(__dirname, "../../convex"),
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      outDir: path.resolve(__dirname, "../../dist"),
      emptyOutDir: true,
      chunkSizeWarningLimit: 1000,
    },
  }
});
