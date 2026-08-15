import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/hb-datav/",
  resolve: {
    alias: {
      "@": resolve("src"),
    },
  },
  server: {
    port: 8005
  }
});
