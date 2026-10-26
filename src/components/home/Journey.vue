<script setup lang="ts">
import { computed } from "vue";
import { useContent } from "../../content/useContent";
import Bi from "../Bi.vue";
import OssImage from "../OssImage.vue";

const content = useContent();
const b = computed(() => content.value.blocks.journey);
</script>

<template>
  <section v-if="b.visible" class="journey" aria-labelledby="journey-title" data-reveal-section>
    <div class="wrap journey__layout">
      <header class="section-head journey__head">
        <div>
          <p class="section-kicker"><Bi :t="b.kicker" /></p>
          <h2 id="journey-title" class="section-title"><Bi :t="b.title" /></h2>
          <p class="section-sub"><Bi :t="b.sub" /></p>
        </div>
        <a class="btn btn--ghost journey__order" :href="content.store.links.order" target="_blank" rel="noopener"><span lang="en">Order now</span><span lang="zh">立即点单</span></a>
      </header>
      <div class="journey__body">
        <figure class="journey__photo" data-reveal-item>
          <OssImage :media="b.image" sizes="(max-width: 51.25rem) 90vw, 40vw" />
          <figcaption><Bi :t="b.caption" /></figcaption>
        </figure>
        <ol class="journey__steps">
          <li v-for="(step, i) in b.steps" :key="i" data-reveal-item>
            <span class="journey__number">{{ String(i + 1).padStart(2, "0") }}</span>
            <div><h3><Bi :t="step.title" /></h3><p><Bi :t="step.body" /></p></div>
          </li>
        </ol>
      </div>
    </div>
  </section>
</template>
