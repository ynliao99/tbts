import { ViteSSG } from "vite-ssg";
import App from "./App.vue";
import { routes } from "./router";
import "./styles/style.css";

export const createApp = ViteSSG(App, {
  routes,
  // 页面间用普通链接整页跳转；页内锚点交给浏览器
  scrollBehavior: () => false,
});
