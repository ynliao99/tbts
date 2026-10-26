<script setup lang="ts">
// 标语逐词点亮：中文按词切分（Intl.Segmenter，没有就逐字），英文按空格
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useContent } from "../../content/useContent";
import { reducedMotion } from "../../composables/motion";
import Bi from "../Bi.vue";

const content = useContent();
const b = computed(() => content.value.blocks.tagline);
const split = (text: string, lang: "en" | "zh") => {
  if (lang === "zh" && typeof Intl !== "undefined" && "Segmenter" in Intl)
    return [...new Intl.Segmenter("zh", { granularity: "word" }).segment(text)].map((p) => p.segment).filter((w) => w.trim());
  return (lang === "zh" ? [...text] : text.split(/\s+/)).filter((w) => w.trim());
};
const words = computed(() => ({ en: split(b.value.text.en, "en"), zh: split(b.value.text.zh || b.value.text.en, "zh") }));

const root = ref<HTMLElement>();
let observer: IntersectionObserver | undefined;
const bind = () => {
  observer?.disconnect();
  const spans = [...(root.value?.querySelectorAll<HTMLElement>(".tagline-word") ?? [])];
  if (reducedMotion()) return spans.forEach((w) => w.classList.add("is-lit"));
  observer = new IntersectionObserver(
    (entries) => entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const span = entry.target as HTMLElement;
      setTimeout(() => span.classList.add("is-lit"), (+(span.dataset.wordIndex || 0)) * 38);
      observer!.unobserve(span);
    }),
    { rootMargin: "0px 0px -24% 0px", threshold: 0.2 }
  );
  spans.forEach((w) => observer!.observe(w));
};
onMounted(bind);
watch(words, () => nextTick(bind));
onBeforeUnmount(() => observer?.disconnect());
</script>

<template>
  <section v-if="b.visible" ref="root" class="tagline" aria-label="What makes Tea By The Sea different">
    <div class="wrap tagline__inner">
      <p class="section-kicker"><Bi :t="b.kicker" /></p>
      <p class="tagline__text">
        <span lang="en" data-tagline-copy><span v-for="(w, i) in words.en" :key="i" class="tagline-word" :data-word-index="i">{{ w }}</span></span>
        <span lang="zh" data-tagline-copy><span v-for="(w, i) in words.zh" :key="i" class="tagline-word" :data-word-index="i">{{ w }}</span></span>
      </p>
    </div>
  </section>
</template>
