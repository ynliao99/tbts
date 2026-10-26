import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  ssgOptions: {
    script: "async",
    formatting: "none",
    dirStyle: "flat",
    // 404 页单独输出成 404.html，nginx 的 error_page 指向它
    includedRoutes: () => ["/", "/menu", "/privacy", "/terms", "/404"],
  },
  server: {
    // 本地开发：预览模式和咨询表单走同一个反代前缀
    proxy: { "/api/": { target: "https://teabytheseaboston.com", changeOrigin: true } },
  },
});
