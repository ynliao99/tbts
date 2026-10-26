<script setup lang="ts">
import { computed } from "vue";
import { useContent } from "../../content/useContent";
import Bi from "../Bi.vue";
import OssImage from "../OssImage.vue";

const content = useContent();
const b = computed(() => content.value.blocks.deck);
// 拼贴的四个位置和视差系数固定，照片按顺序放进去
const slots = [["a", "0.08"], ["b", "-0.06"], ["c", "0.1"], ["d", "-0.08"]];
</script>

<template>
  <section v-if="b.visible" id="deck" class="deck" aria-labelledby="deck-title">
    <div class="wrap deck__grid">
      <div class="deck__copy">
        <p class="section-kicker"><Bi :t="b.kicker" /></p>
        <h2 id="deck-title" class="section-title"><Bi :t="b.title" /></h2>
        <p v-for="(p, i) in b.paragraphs" :key="i"><Bi :t="p.body" /></p>
      </div>
      <div class="collage">
        <figure
          v-for="(photo, i) in b.photos.slice(0, 4)" :key="i" class="snap" :class="`snap--${slots[i][0]}`" :data-parallax="slots[i][1]"
        >
          <div class="photo-shell">
            <OssImage :media="photo.image" sizes="(max-width: 51.25rem) 50vw, 25vw" :widths="[480, 960]" />
          </div>
          <figcaption><Bi :t="photo.caption" /></figcaption>
        </figure>
      </div>
    </div>
  </section>
</template>
