<script setup lang="ts">
// 三张卡片的文案来自 CMS；右侧的小动画（现泡茶香、甜度拨盘、渡轮航线）是固定装饰。
// 动画只在区块可见时运行，离开视口就暂停。
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useContent } from "../../content/useContent";
import { reducedMotion } from "../../composables/motion";
import Bi from "../Bi.vue";

const content = useContent();
const b = computed(() => content.value.blocks.benefits);

const DIAL_STATES = [
  { sweet: 1, ice: 0, en: "50% sweet · Less ice · Fresh fruit", zh: "半糖 · 少冰 · 鲜果现切" },
  { sweet: 0, ice: 1, en: "30% sweet · No ice · Loose leaf oolong", zh: "三分糖 · 去冰 · 现泡乌龙" },
  { sweet: 2, ice: 2, en: "70% sweet · Warm · House milk tea", zh: "七分糖 · 温热 · 经典珍奶" },
];
const STEEP_STATES = [
  { chip: 0, temp: "90°C", pct: "92%", scale: 0.92 },
  { chip: 1, temp: "94°C", pct: "96%", scale: 0.96 },
  { chip: 2, temp: "92°C", pct: "94%", scale: 0.94 },
];
const aromas = [
  { icon: "i-leaf", en: "Jasmine Green", zh: "高山茉莉" },
  { icon: "i-flame", en: "Roasted Oolong", zh: "炭焙乌龙" },
  { icon: "i-spark", en: "Osmanthus", zh: "馥郁桂花" },
];
const sweets = ["30%", "50%", "70%", "100%"];
const ices = [{ en: "Less ice", zh: "少冰" }, { en: "No ice", zh: "去冰" }, { en: "Warm", zh: "温热" }];
const visuals = [
  "benefit-visual--steep", "benefit-visual--dial", "benefit-visual--harbor",
];

const section = ref<HTMLElement>();
// 航线 path 在 v-for 里，用函数 ref 取单个元素
let route: SVGPathElement | null = null;
const setRoute = (el: unknown) => { route = el as SVGPathElement | null; };
const cardsIn = ref(false);
const steep = ref({ ...STEEP_STATES[2], init: true });
const dial = ref(DIAL_STATES[0]);
const ferry = ref({ x: 16, y: 82 });

let running = false;
let raf = 0;
let loopTime = 0;
let lastTs = 0;
let lastBeat = -1;
let observer: IntersectionObserver | undefined;

const tick = (ts: number) => {
  if (!running) return;
  if (!lastTs) lastTs = ts;
  loopTime += Math.min(0.1, (ts - lastTs) / 1000);
  lastTs = ts;
  const beat = Math.floor(loopTime / 2.2);
  if (beat !== lastBeat) {
    lastBeat = beat;
    steep.value = { ...STEEP_STATES[beat % STEEP_STATES.length], init: false };
    dial.value = DIAL_STATES[(beat + 1) % DIAL_STATES.length];
  }
  const path = route;
  if (path?.getTotalLength) {
    const progress = 0.5 - 0.5 * Math.cos((loopTime / 5.4) * Math.PI * 2);
    const pt = path.getPointAtLength(progress * path.getTotalLength());
    ferry.value = { x: +pt.x.toFixed(1), y: +pt.y.toFixed(1) };
  }
  raf = requestAnimationFrame(tick);
};

onMounted(() => {
  if (!section.value) return;
  if (reducedMotion()) { cardsIn.value = true; return; }
  observer = new IntersectionObserver(
    (entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) {
        cardsIn.value = true;
        if (!running) { running = true; lastTs = 0; raf = requestAnimationFrame(tick); }
      } else {
        running = false;
        cancelAnimationFrame(raf);
      }
    }),
    { threshold: 0.25 }
  );
  observer.observe(section.value);
});
onBeforeUnmount(() => { running = false; cancelAnimationFrame(raf); observer?.disconnect(); });
</script>

<template>
  <section v-if="b.visible" ref="section" class="benefits" aria-labelledby="benefits-title">
    <div class="wrap">
      <header class="section-head">
        <p class="section-kicker"><Bi :t="b.kicker" /></p>
        <h2 id="benefits-title" class="section-title"><Bi :t="b.title" /></h2>
      </header>

      <div class="benefits__bento">
        <article
          v-for="(card, i) in b.cards" :key="i" class="benefit-card" :class="{ 'benefit-card--wide': i === 0, 'is-in': cardsIn }"
          :style="{ '--card-index': i }"
        >
          <div class="benefit-card__copy">
            <span class="benefit-card__kicker"><Bi :t="card.kicker" /></span>
            <h3><Bi :t="card.title" /></h3>
            <p><Bi :t="card.body" rich /></p>
          </div>
          <div class="benefit-visual" :class="visuals[i]" aria-hidden="true">
            <div v-if="i === 0" class="steep-card">
              <div class="steep-card__top">
                <span class="steep-card__badge"><span class="pulse-dot" /><span lang="en">Small batch brew</span><span lang="zh">现泡进行中</span></span>
                <span class="steep-card__temp">{{ steep.temp }}</span>
              </div>
              <div class="steep-card__aroma">
                <span v-for="(a, j) in aromas" :key="j" class="aroma-chip" :class="{ 'is-active': !steep.init && steep.chip === j }">
                  <svg class="icon"><use :href="`#${a.icon}`" /></svg><span lang="en">{{ a.en }}</span><span lang="zh">{{ a.zh }}</span>
                </span>
              </div>
              <div class="steep-bar">
                <div class="steep-bar__label">
                  <span><span lang="en">Infusion clarity</span><span lang="zh">茶汤萃取度</span></span>
                  <strong>{{ steep.pct }}</strong>
                </div>
                <div class="steep-bar__track"><span class="steep-bar__fill" :style="steep.init ? undefined : { transform: `scaleX(${steep.scale})` }" /></div>
              </div>
            </div>
            <div v-else-if="i === 1" class="dial-stage">
              <div class="dial-row">
                <span class="dial-row__label"><span lang="en">Sweetness</span><span lang="zh">甜度</span></span>
                <div class="dial-pills">
                  <span v-for="(s, j) in sweets" :key="s" class="dial-pill" :class="{ 'is-active': dial.sweet === j }">{{ s }}</span>
                </div>
              </div>
              <div class="dial-row">
                <span class="dial-row__label"><span lang="en">Temperature</span><span lang="zh">冰量 / 温度</span></span>
                <div class="dial-pills">
                  <span v-for="(s, j) in ices" :key="j" class="dial-pill" :class="{ 'is-active': dial.ice === j }"><span lang="en">{{ s.en }}</span><span lang="zh">{{ s.zh }}</span></span>
                </div>
              </div>
              <div class="dial-summary">
                <svg class="icon"><use href="#i-cup" /></svg>
                <span><span lang="en">{{ dial.en }}</span><span lang="zh">{{ dial.zh }}</span></span>
              </div>
            </div>
            <div v-else class="harbor-card">
              <svg class="harbor-card__svg" viewBox="0 0 320 110">
                <path :ref="setRoute" class="harbor-card__route" d="M 16 82 Q 96 52 164 74 T 304 58" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="5 5" />
                <circle class="harbor-card__ferry" r="6" :cx="ferry.x" :cy="ferry.y" />
                <circle class="harbor-card__pin" cx="304" cy="58" r="5" />
              </svg>
              <div class="harbor-card__meta">
                <span><span lang="en">99 Sumner St · Waterfront</span><span lang="zh">99 Sumner St · 海滨入口</span></span>
                <strong><span lang="en">Open all 4 seasons</span><span lang="zh">四季开放</span></strong>
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>
