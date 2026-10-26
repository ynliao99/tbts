<script setup lang="ts">
import { useContent } from "../content/useContent";

defineProps<{ footer?: boolean }>();
const content = useContent();
</script>

<template>
  <div class="app-badges" :class="{ 'app-badges--footer': footer }">
    <a class="app-badge app-badge--ios" :href="content.store.links.appStore" target="_blank" rel="noopener">
      <img lang="en" src="/assets/img/badges/app-store-en.svg" alt="Download on the App Store" width="120" height="40" loading="lazy">
      <img lang="zh" src="/assets/img/badges/app-store-zh.svg" alt="在 App Store 下载" width="109" height="40" loading="lazy">
    </a>
    <a class="app-badge app-badge--android" :href="content.store.links.googlePlay" target="_blank" rel="noopener">
      <img lang="en" src="/assets/img/badges/google-play-en.png" alt="Get it on Google Play" width="134" height="40" loading="lazy">
      <img lang="zh" src="/assets/img/badges/google-play-zh.png" alt="去 Google Play 下载" width="135" height="40" loading="lazy">
    </a>
  </div>
</template>
