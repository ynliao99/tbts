<script setup lang="ts">
import { computed } from "vue";
import { useContent } from "../../content/useContent";
import Bi from "../Bi.vue";
import OssImage from "../OssImage.vue";

const content = useContent();
const b = computed(() => content.value.blocks.press);
const links = computed(() => content.value.store.links);
</script>

<template>
  <section v-if="b.visible" class="press" aria-labelledby="press-title">
    <div class="wrap press__grid">
      <div>
        <p class="section-kicker"><Bi :t="b.kicker" /></p>
        <h2 id="press-title" class="press__title"><Bi :t="b.title" /></h2>
        <p><Bi :t="b.body" /></p>
        <div class="press__reviews">
          <p class="press__reviews-label"><Bi :t="b.reviewsLabel" /></p>
          <a class="review-pill" :href="links.google" target="_blank" rel="noopener">
            <svg class="icon" aria-hidden="true"><use href="#i-pin" /></svg><span>Google Reviews</span>
          </a>
          <a class="review-pill" :href="links.yelp" target="_blank" rel="noopener">
            <svg class="icon" aria-hidden="true"><use href="#i-star" /></svg><span>Yelp</span>
          </a>
          <a class="review-pill" :href="links.tripadvisor" target="_blank" rel="noopener">
            <svg class="icon" aria-hidden="true"><use href="#i-spark" /></svg><span>Tripadvisor</span>
          </a>
        </div>
      </div>
      <div class="press__frame" data-parallax="0.06">
        <OssImage class="press__img" :media="b.image" sizes="(max-width: 51.25rem) 90vw, 50vw" />
      </div>
    </div>
  </section>
</template>
