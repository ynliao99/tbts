import type { RouteRecordRaw } from "vue-router";

export const routes: RouteRecordRaw[] = [
  { path: "/", name: "home", component: () => import("./pages/Home.vue") },
  { path: "/menu", name: "menu", component: () => import("./pages/Menu.vue") },
  { path: "/privacy", name: "privacy", component: () => import("./pages/Privacy.vue") },
  { path: "/terms", name: "terms", component: () => import("./pages/Terms.vue") },
  { path: "/404", name: "not-found", component: () => import("./pages/NotFound.vue") },
  { path: "/:pathMatch(.*)*", component: () => import("./pages/NotFound.vue") },
];
