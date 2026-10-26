<script setup lang="ts">
// 每个页面共用的外壳：图标、跳转链接、顶栏、页脚、预览横条；挂载后同步语言链接并触发首屏动画
import { onMounted, watch } from "vue";
import { usePreviewMode } from "../content/useContent";
import { syncLangLinks } from "../composables/lang";
import { markReady } from "../composables/motion";
import IconSprite from "./IconSprite.vue";
import SiteHeader from "./SiteHeader.vue";
import SiteFooter from "./SiteFooter.vue";

const props = defineProps<{ page: "home" | "menu" | "legal"; mainClass?: string }>();
const preview = usePreviewMode();

onMounted(() => {
  const url = new URL(location.href);
  url.searchParams.set("lang", document.documentElement.dataset.lang || "en");
  history.replaceState(history.state, "", url);
  syncLangLinks();
  markReady();
  // 从别的页面带锚点跳过来（/menu#cat-matcha、/#teas）：水合后再手动定位一次，浏览器自己的跳转可能发生在样式就绪之前
  const target = location.hash.length > 1 && document.getElementById(decodeURIComponent(location.hash.slice(1)));
  if (target) target.scrollIntoView({ behavior: "instant" });
});
watch(preview, () => setTimeout(syncLangLinks));
</script>

<template>
  <IconSprite />
  <a class="skip" href="#main"><span lang="en">Skip to content</span><span lang="zh">跳到正文</span></a>
  <p v-if="preview" class="preview-banner" role="status">
    <span lang="en">Preview · unpublished draft</span><span lang="zh">预览中 · 草稿尚未发布</span>
  </p>
  <SiteHeader :page="props.page" />
  <main id="main" :class="mainClass">
    <slot />
  </main>
  <SiteFooter v-if="page !== 'legal'" :app-anchor="page !== 'home'" />
</template>
