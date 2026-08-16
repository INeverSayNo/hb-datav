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
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          // 前缀 vendor- 是为了避开与源码同名文件产生的 chunk 命名冲突
          // （src/pages/Index/map/three.tsx 也会生成名为 three 的 chunk）
          if (/[\\/]node_modules[\\/](three|three-stdlib)[\\/]/.test(id)) {
            return "vendor-three";
          }
          if (/[\\/]node_modules[\\/](echarts|zrender)[\\/]/.test(id)) {
            return "vendor-echarts";
          }
          if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) {
            return "vendor-react";
          }
        },
      },
    },
  },
  server: {
    port: 8001,
  },
});
