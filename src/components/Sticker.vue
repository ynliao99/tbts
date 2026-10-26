<script setup lang="ts">
// 菜品贴纸卡片（首页人气必点、菜单页有图的分类共用）；整张卡片新窗口打开 Chowbus 点单
import type { MenuItem } from "../content/types";
import { useContent } from "../content/useContent";
import { cleanCopy } from "../composables/store";
import OssImage from "./OssImage.vue";

defineProps<{ item: MenuItem; index: number; withDesc?: boolean }>();
const content = useContent();
</script>

<template>
  <li class="sticker" :class="{ 'is-soldout': item.soldOut }" :style="{ '--sticker-index': index }">
    <a class="sticker__link" :href="item.orderUrl || content.store.links.order" target="_blank" rel="noopener" :aria-label="`${item.name.en} ${item.price} · Order on Chowbus`">
    <div class="sticker__img">
      <div class="photo-shell">
        <OssImage v-if="item.image" :media="item.image" :alt="item.name.en" :w="720" :h="900" sizes="(max-width: 40rem) 46vw, (max-width: 60rem) 30vw, 22vw" :widths="[360, 720]" />
      </div>
      <span class="sticker__price">{{ item.price }}</span>
      <span v-if="item.soldOut" class="sticker__soldout"><span lang="en">Sold out</span><span lang="zh">售罄</span></span>
    </div>
    <p class="sticker__name">{{ item.name.en }}</p>
    <p v-if="item.name.zh" class="sticker__zh">{{ item.name.zh }}</p>
    <p v-if="withDesc && item.desc.en" class="sticker__desc">{{ cleanCopy(item.desc.en) }}</p>
    </a>
  </li>
</template>
