<script setup lang="ts">
import { computed } from "vue";
import { useContent } from "../../content/useContent";
import Bi from "../Bi.vue";

const content = useContent();
const b = computed(() => content.value.blocks.faq);
</script>

<template>
  <section v-if="b.visible" class="faq" aria-labelledby="faq-title" data-reveal-section>
    <div class="wrap faq__grid">
      <header class="section-head">
        <p class="section-kicker"><Bi :t="b.kicker" /></p>
        <h2 id="faq-title" class="section-title"><Bi :t="b.title" /></h2>
        <p class="section-sub"><Bi :t="b.sub" /></p>
      </header>
      <div class="faq__list">
        <details v-for="(item, i) in b.items" :key="i" :open="i === 0" data-reveal-item>
          <summary><Bi :t="item.q" /></summary>
          <p><Bi :t="item.a" /></p>
        </details>
      </div>
    </div>
  </section>
</template>
