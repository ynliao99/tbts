<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { useContent } from "../../content/useContent";
import { bindPhotoShells } from "../../composables/motion";
import Bi from "../Bi.vue";
import Sticker from "../Sticker.vue";

const content = useContent();
const b = computed(() => content.value.blocks.favs);
const cats = computed(() =>
  b.value.categories.map(({ category }) => content.value.menu.find((c) => c.slug === category)).filter((c) => !!c)
);
const active = ref(cats.value[0]?.slug ?? "");
const items = computed(() => (cats.value.find((c) => c.slug === active.value) ?? cats.value[0])?.items.filter((it) => it.image).slice(0, 8) ?? []);
const grid = ref<HTMLElement>();
watch(items, () => nextTick(() => grid.value && bindPhotoShells(grid.value)));
</script>

<template>
  <section v-if="b.visible" class="favs" aria-labelledby="favs-title">
    <div class="wrap">
      <header class="section-head section-head--row">
        <div>
          <p class="section-kicker"><Bi :t="b.kicker" /></p>
          <h2 id="favs-title" class="section-title"><Bi :t="b.title" /></h2>
        </div>
        <div class="favs__actions">
          <a class="link-squiggle" href="/menu"><span lang="en">Full menu &amp; prices</span><span lang="zh">完整菜单和价格</span></a>
          <a class="btn btn--ghost btn--sm" :href="content.store.links.order" target="_blank" rel="noopener"><span lang="en">Order now</span><span lang="zh">立即点单</span></a>
        </div>
      </header>
      <div class="chips" role="tablist" aria-label="Drink categories">
        <button
          v-for="c in cats" :key="c.slug" class="chip" type="button" role="tab" :aria-selected="c.slug === active"
          @click="active = c.slug"
        >
          <Bi :t="c.shortName || c.name" />
        </button>
      </div>
      <ul ref="grid" class="stickers">
        <Sticker v-for="(it, i) in items" :key="it.id" :item="it" :index="i" />
      </ul>
      <p class="favs__note"><Bi :t="b.note" /></p>
    </div>
  </section>
</template>
