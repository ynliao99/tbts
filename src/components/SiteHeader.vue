<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { useContent } from "../content/useContent";
import { toggleLang } from "../composables/lang";
import { bindAppLinks } from "../composables/appLink";

// page: home 首页（页内锚点 + 滚动高亮），menu 菜单页（顶栏只在菜单工具栏上方出现），legal 法律页（精简顶栏）
const props = defineProps<{ page: "home" | "menu" | "legal" }>();
const content = useContent();
const header = ref<HTMLElement>();
const navOpen = ref(false);
const hidden = ref(false);
const current = ref("");
const home = props.page === "home" ? "" : "/";

const sections = [
  { id: "teas", en: "Our teas", zh: "茶底" },
  { id: "deck", en: "The view", zh: "海景" },
  { id: "space", en: "Events", zh: "场地" },
  { id: "visit", en: "Visit", zh: "到店" },
];

const setNav = (open: boolean) => {
  navOpen.value = open;
  document.body.classList.toggle("nav-open", open);
};
const onNavClick = (e: MouseEvent) => {
  if ((e.target as Element).closest("a")) setNav(false);
};
const onKey = (e: KeyboardEvent) => {
  if (e.key === "Escape") setNav(false);
};

// 手机上下滑收起、上滑出现；菜单页（所有宽度）只在搜索/分类条上方出现，两者不叠在一起
let lastY = 0;
const onScroll = () => {
  const y = window.scrollY;
  const bar = document.querySelector(".menu-bar");
  if (navOpen.value) lastY = y;
  else if (bar && header.value) hidden.value = bar.getBoundingClientRect().top < header.value.getBoundingClientRect().bottom + 8;
  else if (Math.abs(y - lastY) > 8) {
    hidden.value = y > lastY && y > 120;
    lastY = y;
  }
  document.documentElement.classList.toggle("header-hidden", hidden.value);
};

let spy: IntersectionObserver | undefined;
onMounted(() => {
  bindAppLinks(content.value.store, header.value);
  lastY = window.scrollY;
  window.addEventListener("scroll", onScroll, { passive: true });
  document.addEventListener("keydown", onKey);
  onScroll();
  if (props.page === "home") {
    spy = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) current.value = e.target.id; }),
      { rootMargin: "-35% 0px -55% 0px" }
    );
    sections.forEach((s) => { const el = document.getElementById(s.id); if (el) spy!.observe(el); });
  }
});
onBeforeUnmount(() => {
  window.removeEventListener("scroll", onScroll);
  document.removeEventListener("keydown", onKey);
  spy?.disconnect();
  document.body.classList.remove("nav-open");
});
</script>

<template>
  <header ref="header" class="site-header" :class="{ 'is-hidden': hidden }">
    <div class="site-header__inner">
      <a class="brand" href="/" :aria-current="page === 'home' ? 'page' : undefined" aria-label="Tea By The Sea home">
        <img src="/assets/img/brand/logo.webp" alt="" width="48" height="48">
      </a>
      <a v-if="page === 'legal'" class="text-link" href="/"><span lang="en">Back home</span><span lang="zh">返回首页</span></a>
      <nav v-else class="nav" aria-label="Main">
        <button
          class="nav__toggle" type="button" :aria-expanded="navOpen" aria-controls="nav-list"
          :aria-label="navOpen ? 'Close navigation' : 'Open navigation'" @click="setNav(!navOpen)"
        >
          <span class="nav__toggle-lines" aria-hidden="true"><i /><i /></span>
          <span class="visually-hidden" lang="en">Menu</span><span class="visually-hidden" lang="zh">导航</span>
        </button>
        <ul id="nav-list" class="nav__list" :class="{ 'is-open': navOpen }" @click="onNavClick">
          <li class="nav__home"><a :href="page === 'home' ? '#main' : '/'"><span lang="en">Home</span><span lang="zh">首页</span></a></li>
          <li><a href="/menu" :aria-current="page === 'menu' ? 'page' : undefined"><span lang="en">Menu</span><span lang="zh">菜单</span></a></li>
          <li v-for="s in sections" :key="s.id">
            <a :href="`${home}#${s.id}`" :aria-current="current === s.id ? 'true' : undefined"><span lang="en">{{ s.en }}</span><span lang="zh">{{ s.zh }}</span></a>
          </li>
        </ul>
      </nav>
      <div class="site-header__actions">
        <button class="lang-switch" type="button" aria-label="切换到中文 / Switch to English" @click="toggleLang">
          <span class="lang-switch__opt" data-opt="en">EN</span><span class="lang-switch__opt" data-opt="zh">中</span>
        </button>
        <template v-if="page !== 'legal'">
          <a class="btn btn--ghost btn--sm btn--app" data-app-link href="#get-app">
            <span lang="en">Get the app</span><span lang="zh">下载 App</span>
          </a>
          <a class="btn btn--primary btn--sm" :href="content.store.links.order" target="_blank" rel="noopener">
            <span lang="en">Order now</span><span lang="zh">立即点单</span>
          </a>
        </template>
      </div>
    </div>
  </header>
</template>
