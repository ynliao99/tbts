<script setup lang="ts">
// CMS 图片：public-pic.uswoo.cn 上的图用 OSS 图片处理输出多尺寸 webp；站内 /assets 图原样输出。
import { computed } from "vue";
import type { Media } from "../content/types";

const props = withDefaults(defineProps<{
  media: Media;
  alt?: string;
  sizes?: string;
  widths?: number[];
  lazy?: boolean;
  w?: number;
  h?: number;
}>(), { sizes: "100vw", widths: () => [480, 960, 1600], lazy: true });

const isOss = computed(() => /^https:\/\/public-pic\.uswoo\.cn\//.test(props.media.url));
const variant = (w: number) => `${props.media.url}?x-oss-process=image/resize,w_${w}/format,webp`;
const srcset = computed(() =>
  isOss.value ? props.widths.filter((w) => w < props.media.w).concat(props.media.w).map((w) => `${variant(w)} ${w}w`).join(", ") : undefined
);
</script>

<template>
  <img
    :src="isOss ? variant(Math.min(props.media.w, props.widths[props.widths.length - 1])) : media.url"
    :srcset="srcset"
    :sizes="isOss ? sizes : undefined"
    :alt="alt ?? media.alt.en"
    :width="w ?? media.w"
    :height="h ?? media.h"
    :loading="lazy ? 'lazy' : undefined"
    decoding="async"
  >
</template>
