<script setup lang="ts">
import { computed } from "vue";
import { useContent } from "../../content/useContent";
import Bi from "../Bi.vue";

const content = useContent();
const b = computed(() => content.value.blocks.finalCta);
</script>

<template>
  <section v-if="b.visible" class="final-cta" aria-labelledby="final-cta-title" data-reveal-section>
    <div class="wrap final-cta__inner">
      <div>
        <p class="section-kicker"><Bi :t="b.kicker" /></p>
        <h2 id="final-cta-title"><Bi :t="b.title" /></h2>
      </div>
      <a class="btn btn--primary" :href="content.store.links.order" target="_blank" rel="noopener"><span lang="en">Order now</span><span lang="zh">立即点单</span></a>
    </div>
  </section>
</template>
