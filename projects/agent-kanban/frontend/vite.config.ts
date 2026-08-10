import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@agent-kanban/core": path.resolve(__dirname, "../packages/kanban-core/src/index.ts"),
      "@agent-kanban/ui": path.resolve(__dirname, "../packages/kanban-ui/src/index.ts"),
    },
  },
  server: {
    port: 5173,
    fs: {
      allow: [
        path.resolve(__dirname, ".."),
        path.resolve(__dirname, "../../../base/innate-fe-base"),
      ],
    },
    proxy: {
      "/api": {
        target: process.env.BACKEND_URL || "http://localhost:4001",
        changeOrigin: true,
      },
    },
  },
});
