<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useHead } from "@unhead/vue";
import { useContent } from "../content/useContent";
import { cleanCopy } from "../composables/store";
import { bindPhotoShells, setupReveal } from "../composables/motion";
import { bindAppLinks } from "../composables/appLink";
import { usePageSeo } from "../composables/seo";
import PageShell from "../components/PageShell.vue";
import Bi from "../components/Bi.vue";
import Sticker from "../components/Sticker.vue";
import type { MenuItem } from "../content/types";

const content = useContent();
const page = computed(() => content.value.blocks.menuPage);
usePageSeo({
  path: "/menu",
  title: () => content.value.seo.menu.title,
  description: () => content.value.seo.menu.description,
  image: () => content.value.blocks.deck.photos[0]?.image ?? content.value.seo.ogImage,
});
useHead({ bodyAttrs: { class: "page-menu" } });

const query = ref("");
const haystack = (it: MenuItem) => [it.name.en, it.name.zh, it.price, cleanCopy(it.desc.en), it.desc.zh].join(" ").toLowerCase();
const sections = computed(() => {
  const q = query.value.trim().toLowerCase();
  return content.value.menu.map((c) => ({
    ...c,
    photo: c.items.some((it) => it.image),
    shown: c.items.filter((it) => !q || haystack(it).includes(q)),
  }));
});
const anyShown = computed(() => sections.value.some((s) => s.shown.length));

// 分类标签跟随滚动高亮，并只横向滚动标签行
const chips = ref<HTMLElement>();
const currentCat = ref("");
let spy: IntersectionObserver | undefined;
let cleanupReveal = () => {};
const scrollChipIntoRow = (chip: HTMLElement) => {
  const row = chips.value!;
  const l = chip.getBoundingClientRect().left - row.getBoundingClientRect().left + row.scrollLeft;
  const w = chip.offsetWidth;
  if (l < row.scrollLeft) row.scrollTo({ left: l });
  else if (l + w > row.scrollLeft + row.clientWidth) row.scrollTo({ left: l + w - row.clientWidth });
};
const bind = () => {
  spy?.disconnect();
  cleanupReveal();
  bindPhotoShells();
  cleanupReveal = setupReveal([[".menu-hero", ".menu-hero__grid"]]);
  spy = new IntersectionObserver(
    (entries) => entries.forEach((en) => {
      if (!en.isIntersecting) return;
      currentCat.value = (en.target as HTMLElement).dataset.cat || "";
      const chip = chips.value?.querySelector<HTMLElement>(`.chip[data-cat="${currentCat.value}"]`);
      if (chip) scrollChipIntoRow(chip);
    }),
    { rootMargin: "-40% 0px -55% 0px" }
  );
  document.querySelectorAll(".menu-section").forEach((s) => spy!.observe(s));
};
onMounted(() => {
  bind();
  bindAppLinks(content.value.store);
});
watch([content, query], () => nextTick(bind));
onBeforeUnmount(() => { spy?.disconnect(); cleanupReveal(); });
</script>

<template>
  <PageShell page="menu">
    <section class="menu-hero" aria-labelledby="menu-title">
      <div class="wrap menu-hero__grid">
        <div>
          <p class="section-kicker"><Bi :t="page.kicker" /></p>
          <h1 id="menu-title"><Bi :t="page.title" /></h1>
          <p><Bi :t="page.intro" /></p>
        </div>
        <a class="btn btn--primary" :href="content.store.links.order" target="_blank" rel="noopener">
          <span lang="en">Order now</span><span lang="zh">立即点单</span>
        </a>
      </div>
      <svg class="menu-hero__wave" viewBox="0 0 1200 40" preserveAspectRatio="none" aria-hidden="true"><path d="M0 40V22 Q 75 4 150 22 T 300 22 T 450 22 T 600 22 T 750 22 T 900 22 T 1050 22 T 1200 22 V40Z" /></svg>
    </section>

    <div class="menu-bar">
      <div class="wrap">
        <label class="menu-search">
          <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.4-4.4" /></svg>
          <span class="visually-hidden">Search the menu / 搜索菜单</span>
          <input v-model="query" type="search" placeholder="Search: mango, 芝士, oolong…" autocomplete="off">
        </label>
        <nav ref="chips" class="chips" aria-label="Menu categories">
          <a
            v-for="c in content.menu" :key="c.slug" class="chip" :href="`#cat-${c.slug}`" :data-cat="c.slug"
            :aria-current="currentCat === c.slug ? 'true' : undefined"
          ><Bi :t="c.name" /></a>
        </nav>
      </div>
    </div>

    <div class="wrap">
      <div>
        <section
          v-for="c in sections" :id="`cat-${c.slug}`" :key="c.slug" class="menu-section" :data-cat="c.slug"
          :aria-labelledby="`h-${c.slug}`" :hidden="!c.shown.length || undefined"
        >
          <h2 :id="`h-${c.slug}`" class="menu-section__title">{{ c.name.en }} <small>{{ c.name.zh }}</small></h2>
          <ul v-if="c.photo" class="stickers">
            <Sticker v-for="(it, i) in c.shown" :key="it.id" :item="it" :index="i" with-desc />
          </ul>
          <ul v-else class="menu-list">
            <li v-for="it in c.shown" :key="it.id" class="menu-row">
              <span class="menu-row__name">{{ it.name.en }}</span>
              <span class="menu-row__price">{{ it.price }}<template v-if="it.soldOut"> · <span lang="en">Sold out</span><span lang="zh">售罄</span></template></span>
              <span v-if="it.name.zh" class="menu-row__zh">{{ it.name.zh }}</span>
              <span v-if="it.desc.en" class="menu-row__desc">{{ cleanCopy(it.desc.en) }}</span>
            </li>
          </ul>
        </section>
      </div>
      <p class="menu-empty" :hidden="anyShown || undefined">
        <span lang="en">Nothing matches that yet. Try another flavor, like “peach” or “taro”.</span>
        <span lang="zh">没有找到，换个口味试试，比如“桃”或“芋泥”。</span>
      </p>
      <p class="menu-footnote"><Bi :t="page.footnote" /></p>
    </div>
  </PageShell>
</template>
