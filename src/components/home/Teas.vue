<script setup lang="ts">
// 八款茶底：标签切换（键盘方向键、左右滑动、前后按钮），切换时有弹性动画
import { computed, nextTick, ref } from "vue";
import { useContent } from "../../content/useContent";
import { cleanCopy } from "../../composables/store";
import Bi from "../Bi.vue";
import OssImage from "../OssImage.vue";

const content = useContent();
const b = computed(() => content.value.blocks.teas);
const teas = computed(() => content.value.teas);
const index = ref(0);
const tea = computed(() => teas.value[Math.min(index.value, teas.value.length - 1)]);
const pad = (n: number) => String(n).padStart(2, "0");

const tabs = ref<HTMLElement>();
const img = ref<HTMLElement>();
const switching = ref(false);

const show = async (i: number, animate = true) => {
  const n = teas.value.length;
  index.value = ((i % n) + n) % n;
  const row = tabs.value;
  const active = row?.children[index.value] as HTMLElement | undefined;
  if (row && active && row.scrollWidth > row.clientWidth) {
    // 只横向滚动标签行；scrollIntoView 会把整个页面也滚到这里
    const offset = active.getBoundingClientRect().left - row.getBoundingClientRect().left + row.scrollLeft;
    row.scrollTo({ left: offset - (row.clientWidth - active.offsetWidth) / 2, behavior: animate ? "smooth" : "instant" });
  }
  if (animate) {
    switching.value = false;
    const el = (img.value as unknown as { $el?: HTMLElement })?.$el ?? img.value;
    el?.classList.remove("is-pouring");
    await nextTick();
    void el?.offsetWidth;
    el?.classList.add("is-pouring");
    switching.value = true;
  }
};

const onKey = (e: KeyboardEvent) => {
  const keys: Record<string, number> = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };
  if (!(e.key in keys)) return;
  e.preventDefault();
  show(index.value + keys[e.key]);
  nextTick(() => (tabs.value?.children[index.value] as HTMLElement)?.focus());
};

let touch = { x: 0, y: 0, t: 0 };
const onTouchStart = (e: TouchEvent) => {
  if (e.touches.length !== 1) return;
  touch = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now() };
};
const onTouchEnd = (e: TouchEvent) => {
  if (!touch.x) return;
  const dx = e.changedTouches[0].clientX - touch.x;
  const dy = e.changedTouches[0].clientY - touch.y;
  const dt = Date.now() - touch.t;
  touch = { x: 0, y: 0, t: 0 };
  if (dt > 650) return;
  if (Math.abs(dx) > 36 && Math.abs(dx) > Math.abs(dy) * 1.2) show(index.value + (dx < 0 ? 1 : -1));
};
</script>

<template>
  <section v-if="b.visible" id="teas" class="teas" aria-labelledby="teas-title">
    <div class="wrap">
      <header class="section-head">
        <p class="section-kicker"><Bi :t="b.kicker" /></p>
        <h2 id="teas-title" class="section-title"><Bi :t="b.title" /></h2>
        <p class="section-sub"><Bi :t="b.sub" /></p>
      </header>

      <div v-if="tea" class="tea-explorer" :style="{ '--tint': tea.tint }">
        <div ref="tabs" class="tea-list" role="tablist" aria-label="Tea bases" @keydown="onKey">
          <button
            v-for="(t, i) in teas" :id="`tea-tab-${t.id}`" :key="t.id" class="tea-tab" type="button" role="tab"
            aria-controls="tea-panel" :aria-selected="i === index" :tabindex="i === index ? 0 : -1" :style="{ '--tint': t.tint }"
            @click="show(i)"
          >
            <span class="tea-tab__en">{{ t.name.en }}</span><span class="tea-tab__zh">{{ t.name.zh }}</span>
          </button>
        </div>
        <div
          id="tea-panel" class="tea-stage" :class="{ 'is-switching': switching }" role="tabpanel" tabindex="0"
          :aria-labelledby="`tea-tab-${tea.id}`" @touchstart.passive="onTouchStart" @touchend.passive="onTouchEnd"
        >
          <div class="tea-stage__nav-bar">
            <span class="tea-stage__badge"><span lang="en">Base {{ pad(index + 1) }} / {{ pad(teas.length) }}</span><span lang="zh">茶底 {{ pad(index + 1) }} / {{ pad(teas.length) }}</span></span>
            <div class="tea-stage__controls" aria-label="Switch tea">
              <button class="tea-stage__arrow tea-stage__arrow--prev" type="button" aria-label="Previous tea" @click="show(index - 1)">‹</button>
              <span class="tea-stage__swipe-tag"><span lang="en">Swipe left/right</span><span lang="zh">左右滑动切换</span></span>
              <button class="tea-stage__arrow tea-stage__arrow--next" type="button" aria-label="Next tea" @click="show(index + 1)">›</button>
            </div>
          </div>
          <div class="tea-stage__cup">
            <span class="tea-stage__splash" aria-hidden="true" />
            <OssImage ref="img" :media="tea.image" :alt="`${tea.name.en} in a Tea By The Sea cup`" :lazy="false" sizes="(max-width: 51.25rem) 70vw, 30vw" :widths="[480, 700]" :w="700" :h="700" />
          </div>
          <div class="tea-stage__info" :class="{ 'is-switching': switching }">
            <h3 class="tea-stage__name">{{ tea.name.en }}</h3>
            <p class="tea-stage__zh">{{ tea.name.zh }}</p>
            <p class="tea-stage__desc"><Bi :t="{ en: cleanCopy(tea.desc.en), zh: tea.desc.zh }" /></p>
            <dl class="tea-meters">
              <div><dt><span lang="en">Flavor notes</span><span lang="zh">香气风味</span></dt><dd><Bi :t="{ en: cleanCopy(tea.notes.en), zh: tea.notes.zh }" /></dd></div>
              <div>
                <dt><span lang="en">Roast level</span><span lang="zh">焙火程度</span></dt>
                <dd>
                  <div class="meter meter--roast">
                    <svg v-for="n in 5" :key="n" class="icon" :class="{ 'is-on': n <= tea.roast }" aria-hidden="true"><use href="#i-flame" /></svg>
                    <span v-if="tea.roast" class="visually-hidden">{{ tea.roast }}/5</span>
                    <span v-else class="meter__none"><span lang="en">Unroasted / 0</span><span lang="zh">无</span></span>
                  </div>
                  <div class="meter-bar"><span class="meter-bar__fill" :style="{ '--level': (tea.roast / 5).toFixed(2) }" /></div>
                </dd>
              </div>
              <div>
                <dt><span lang="en">Fermentation</span><span lang="zh">发酵程度</span></dt>
                <dd>
                  <div class="meter meter--ferment">
                    <svg v-for="n in 5" :key="n" class="icon" :class="{ 'is-on': n <= tea.ferment }" aria-hidden="true"><use href="#i-leaf" /></svg>
                    <span v-if="tea.ferment" class="visually-hidden">{{ tea.ferment }}/5</span>
                    <span v-else class="meter__none"><span lang="en">Unroasted / 0</span><span lang="zh">无</span></span>
                  </div>
                  <div class="meter-bar"><span class="meter-bar__fill" :style="{ '--level': (tea.ferment / 5).toFixed(2) }" /></div>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
