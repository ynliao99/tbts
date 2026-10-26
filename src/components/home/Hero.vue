<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useContent } from "../../content/useContent";
import { openStatus } from "../../composables/store";
import Bi from "../Bi.vue";
import OssImage from "../OssImage.vue";

const content = useContent();
const hero = computed(() => content.value.blocks.hero);
// 营业状态依赖访问时刻，只在浏览器里算，避免预渲染的 HTML 写死某个时间点
const status = ref<ReturnType<typeof openStatus> | null>(null);
onMounted(() => { status.value = openStatus(content.value.store); });

const mascotLines = { en: ["hey there", "boba time?", "nice view, right?", "fresh brewed"], zh: ["嗨，来坐坐", "来一杯？", "风景不错吧", "现泡好茶"] };
const bubble = ref("hey!");
const hello = ref(false);
let n = 0;
let timer: ReturnType<typeof setTimeout>;
const sayHi = () => {
  const lang = document.documentElement.dataset.lang === "zh" ? "zh" : "en";
  bubble.value = mascotLines[lang][n++ % mascotLines[lang].length];
  hello.value = false;
  requestAnimationFrame(() => { hello.value = true; });
  clearTimeout(timer);
  timer = setTimeout(() => { hello.value = false; }, 2200);
};
</script>

<template>
  <section v-if="hero.visible" class="hero" aria-labelledby="hero-title">
    <div class="hero__grid">
      <div class="hero__copy">
        <p class="hero__eyebrow"><Bi :t="hero.eyebrow" /></p>
        <h1 id="hero-title" class="hero__title"><Bi :t="hero.title" rich /></h1>
        <p class="hero__lede"><Bi :t="hero.lede" /></p>
        <div class="hero__actions">
          <a class="btn btn--primary" :href="content.store.links.order" target="_blank" rel="noopener">
            <span lang="en">Order now</span><span lang="zh">立即点单</span>
          </a>
          <a class="btn btn--ghost" data-app-link href="#get-app">
            <span lang="en">Get the app</span><span lang="zh">下载 App</span>
          </a>
          <a class="text-link" href="/menu">
            <span lang="en">Full Menu</span><span lang="zh">完整菜单</span>
          </a>
        </div>
        <div class="hero__status-cards">
          <p class="open-badge" :data-state="status?.state" aria-live="polite"><Bi v-if="status" :t="status" /></p>
          <ul class="hero__proof" aria-label="Store highlights">
            <li v-for="(p, i) in hero.proof" :key="i"><strong>{{ p.value }}</strong><Bi :t="p.label" /></li>
          </ul>
        </div>
      </div>

      <figure class="hero__photo" data-parallax="0.12">
        <div class="photo-shell">
          <OssImage :media="hero.image" :lazy="false" sizes="(max-width: 51.25rem) 90vw, 45vw" />
        </div>
        <figcaption class="note"><Bi :t="hero.caption" /></figcaption>
        <svg class="note-arrow" viewBox="0 0 80 60" aria-hidden="true"><path d="M6 8c22 2 44 12 56 38m0 0-12-4m12 4 3-13" /></svg>
      </figure>
    </div>

    <div class="scene" aria-hidden="true">
      <svg class="scene__sun" viewBox="0 0 120 120">
        <circle cx="64" cy="58" r="34" class="sun-fill" />
        <g class="sun-line"><circle cx="58" cy="62" r="34" />
          <path d="M58 14V4M58 120v-10M10 62H0M116 62h-10M24 28l-7-7M99 103l-7-7M24 96l-7 7M99 21l-7 7" /></g>
      </svg>
      <svg class="scene__gull scene__gull--a" viewBox="0 0 40 16"><use href="#i-gull" /></svg>
      <svg class="scene__gull scene__gull--b" viewBox="0 0 40 16"><use href="#i-gull" /></svg>
      <img class="scene__skyline" src="/assets/svg/skyline.svg" alt="">
      <div class="scene__sea">
        <svg class="wave wave--back" viewBox="0 0 1200 40" preserveAspectRatio="none"><path d="M0 20 Q 50 2 100 20 T 200 20 T 300 20 T 400 20 T 500 20 T 600 20 T 700 20 T 800 20 T 900 20 T 1000 20 T 1100 20 T 1200 20" /></svg>
        <svg class="wave wave--front" viewBox="0 0 1200 40" preserveAspectRatio="none"><path class="wave__fill" d="M0 22 Q 75 4 150 22 T 300 22 T 450 22 T 600 22 T 750 22 T 900 22 T 1050 22 T 1200 22 V40 H0Z" /><path class="wave__line" d="M0 22 Q 75 4 150 22 T 300 22 T 450 22 T 600 22 T 750 22 T 900 22 T 1050 22 T 1200 22" /></svg>
      </div>
    </div>

    <button class="mascot" :class="{ 'is-hello': hello }" type="button" aria-label="Say hi to our cup" @click="sayHi">
      <span class="mascot__bubble">{{ bubble }}</span>
      <svg viewBox="0 0 120 190" aria-hidden="true">
        <g class="mascot__body">
          <path class="m-straw" d="M70 4 62 46" />
          <path class="m-lid" d="M22 50c2-18 18-26 38-26s36 8 38 26Z" />
          <path class="m-rim" d="M16 50h88v9H16z" />
          <path class="m-cup" d="M20 59h80l-8 112c-.4 6-5 10-11 10H39c-6 0-10.6-4-11-10Z" />
          <path class="m-tea" d="M22 92c12 5 24-4 38 0s26 5 38 0l-6 79c-.4 6-5 10-11 10H39c-6 0-10.6-4-11-10Z" />
          <g class="m-boba"><circle cx="40" cy="166" r="5" /><circle cx="54" cy="170" r="5" /><circle cx="68" cy="167" r="5" /><circle cx="81" cy="163" r="5" /><circle cx="47" cy="156" r="5" /><circle cx="74" cy="154" r="5" /></g>
          <g class="m-face"><circle cx="46" cy="116" r="3.4" /><circle cx="74" cy="116" r="3.4" /><path d="M52 126c4 5 12 5 16 0" /></g>
          <g class="m-cheek"><ellipse cx="38" cy="126" rx="6" ry="3.4" /><ellipse cx="82" cy="126" rx="6" ry="3.4" /></g>
          <path class="m-arm m-arm--wave" d="M100 104c8-4 13-12 14-22" />
          <path class="m-arm" d="M22 108c-8 4-12 10-12 18" />
        </g>
      </svg>
    </button>
  </section>
</template>
