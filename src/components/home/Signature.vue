<script setup lang="ts">
import { computed } from "vue";
import { useContent } from "../../content/useContent";
import Bi from "../Bi.vue";
import OssImage from "../OssImage.vue";

const content = useContent();
const b = computed(() => content.value.blocks.signature);
</script>

<template>
  <section v-if="b.visible" class="signature" aria-labelledby="signature-title" data-reveal-section>
    <div class="wrap">
      <header class="section-head">
        <p class="section-kicker"><Bi :t="b.kicker" /></p>
        <h2 id="signature-title" class="section-title"><Bi :t="b.title" /></h2>
        <p class="section-sub"><Bi :t="b.sub" /></p>
      </header>
      <ul class="signature__grid">
        <li v-for="card in b.cards" :key="card.theme" class="signature-card" :class="`signature-card--${card.theme}`" data-reveal-item>
          <a class="signature-card__link" :href="`/menu#cat-${card.category}`">
            <h3 class="signature-card__title"><Bi :t="card.title" /></h3>
            <p class="signature-card__desc"><Bi :t="card.desc" /></p>
            <span class="signature-card__more"><Bi :t="card.more" /></span>
            <OssImage class="signature-card__img" :media="card.image" sizes="(max-width: 51.25rem) 44vw, 30vw" :widths="[480, 960]" />
          </a>
        </li>
      </ul>
    </div>
  </section>
</template>
