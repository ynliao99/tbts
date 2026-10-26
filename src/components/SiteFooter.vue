<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useContent } from "../content/useContent";
import { dailyHours } from "../composables/store";
import AppBadges from "./AppBadges.vue";
import Bi from "./Bi.vue";

// 首页的 #get-app 锚点在「到店」区块里；其他页面落在页脚
defineProps<{ appAnchor?: boolean }>();
const content = useContent();
const store = computed(() => content.value.store);
const year = ref(2026);
onMounted(() => { year.value = new Date().getFullYear(); });
</script>

<template>
  <footer class="site-footer">
    <svg class="site-footer__wave" viewBox="0 0 1200 40" preserveAspectRatio="none" aria-hidden="true"><path d="M0 40V22 Q 75 4 150 22 T 300 22 T 450 22 T 600 22 T 750 22 T 900 22 T 1050 22 T 1200 22 V40Z" /></svg>
    <div class="wrap site-footer__grid">
      <div>
        <img class="site-footer__logo" src="/assets/img/brand/logo.webp" alt="Tea By The Sea" width="96" height="96" loading="lazy">
        <div :id="appAnchor ? 'get-app' : undefined" class="site-footer__app">
          <h2 class="site-footer__head"><span lang="en">Get the app</span><span lang="zh">下载 App</span></h2>
          <AppBadges footer />
        </div>
      </div>
      <div>
        <h2 class="site-footer__head"><span lang="en">Visit</span><span lang="zh">地址</span></h2>
        <p><template v-for="(line, i) in store.address.en.slice(1)" :key="i"><br v-if="i">{{ line }}</template></p>
        <p><Bi :t="dailyHours(store)" /></p>
      </div>
      <div>
        <h2 class="site-footer__head"><span lang="en">Say hi</span><span lang="zh">联系我们</span></h2>
        <p><a :href="`tel:${store.phoneIntl}`">{{ store.phone }}</a></p>
        <p><a :href="`mailto:${store.email}`">{{ store.email }}</a></p>
      </div>
      <div>
        <h2 class="site-footer__head"><span lang="en">Follow along</span><span lang="zh">关注我们</span></h2>
        <p class="socials">
          <a :href="store.links.instagram" target="_blank" rel="noopener"><svg class="icon" aria-hidden="true"><use href="#i-ig" /></svg>Instagram</a>
          <a :href="store.links.xiaohongshu" target="_blank" rel="noopener"><svg class="icon" aria-hidden="true"><use href="#i-book" /></svg><span lang="en">RedNote</span><span lang="zh">小红书</span></a>
        </p>
      </div>
    </div>
    <div class="wrap site-footer__legal">
      <p>© <span>{{ year }}</span> Tea By The Sea</p>
      <p class="site-footer__policies"><a href="/privacy"><span lang="en">Privacy</span><span lang="zh">隐私</span></a><a href="/terms"><span lang="en">Terms</span><span lang="zh">条款</span></a></p>
      <p>
        <a lang="en" href="https://www.overseasstudentsservices.com/" target="_blank" rel="noopener">Overseas Student Service Corp.</a>
        <a lang="zh" href="https://www.overseasstudent.com/" target="_blank" rel="noopener">留学生网 · Overseas Student Service Corp.</a>
      </p>
    </div>
  </footer>
</template>
