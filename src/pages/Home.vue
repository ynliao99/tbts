<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, watch } from "vue";
import { useContent } from "../content/useContent";
import { bindAppLinks } from "../composables/appLink";
import { bindPhotoShells, setupHeroTilt, setupParallax, setupReveal } from "../composables/motion";
import { usePageSeo } from "../composables/seo";
import PageShell from "../components/PageShell.vue";
import Hero from "../components/home/Hero.vue";
import Signature from "../components/home/Signature.vue";
import Tagline from "../components/home/Tagline.vue";
import Benefits from "../components/home/Benefits.vue";
import Journey from "../components/home/Journey.vue";
import Teas from "../components/home/Teas.vue";
import Favs from "../components/home/Favs.vue";
import Deck from "../components/home/Deck.vue";
import Press from "../components/home/Press.vue";
import Space from "../components/home/Space.vue";
import Visit from "../components/home/Visit.vue";
import Faq from "../components/home/Faq.vue";
import FinalCta from "../components/home/FinalCta.vue";

const content = useContent();
usePageSeo({
  path: "/",
  title: () => content.value.seo.home.title,
  description: () => content.value.seo.home.description,
  image: () => content.value.seo.ogImage,
});

const REVEAL_GROUPS: [string, string][] = [
  ["[data-reveal-section]", ".section-head, [data-reveal-item], .final-cta__inner"],
  [".teas", ".section-head, .tea-explorer"],
  [".favs", ".section-head, .chips, .stickers, .favs__note"],
  ["#deck", ".deck__copy, .collage .snap"],
  [".press", ".press__grid > *"],
  ["#space", ".space__grid > *"],
  ["#visit", ".visit__grid > *"],
];

let cleanups: (() => void)[] = [];
const bindAll = () => {
  cleanups.forEach((fn) => fn());
  bindPhotoShells();
  bindAppLinks(content.value.store);
  cleanups = [setupReveal(REVEAL_GROUPS), setupParallax(), setupHeroTilt()];
};
onMounted(bindAll);
// CMS 内容在浏览器里被替换（更新版本或预览）后，重新绑定动效
watch(content, () => nextTick(bindAll));
onBeforeUnmount(() => cleanups.forEach((fn) => fn()));
</script>

<template>
  <PageShell page="home">
    <Hero />
    <Signature />
    <Tagline />
    <Benefits />
    <Journey />
    <Teas />
    <Favs />
    <Deck />
    <Press />
    <Space />
    <Visit />
    <Faq />
    <FinalCta />
  </PageShell>
</template>
