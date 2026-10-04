import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

// In development the backend runs separately; proxying keeps requests same-origin,
// so the httpOnly auth cookies set by the backend just work.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const backend = env.BACKEND_URL || "http://127.0.0.1:8000";
  // Keep the browser's Host header: the backend rejects writes whose Origin doesn't match it
  // (CSRF protection). Vite's string shorthand would rewrite Host to the backend address.
  const proxy = { target: backend, changeOrigin: false };
  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        "/api": proxy,
        "/auth": proxy,
        "/health": proxy,
      },
    },
  };
});
