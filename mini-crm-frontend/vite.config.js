import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Proxy API calls to backend during development so CORS is never an issue
    proxy: {
      "/api": {
        target:      "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
});
