<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useContent } from "../../content/useContent";
import { DAYS, fmtTime, storeNow } from "../../composables/store";
import AppBadges from "../AppBadges.vue";
import Bi from "../Bi.vue";
import OssImage from "../OssImage.vue";

const content = useContent();
const b = computed(() => content.value.blocks.visit);
const store = computed(() => content.value.store);
const today = ref(-1); // 「今天」高亮只在浏览器里算
onMounted(() => { today.value = storeNow(store.value.timezone).day; });
</script>

<template>
  <section v-if="b.visible" id="visit" class="visit" aria-labelledby="visit-title">
    <div class="wrap visit__grid">
      <div class="visit__info">
        <p class="section-kicker"><Bi :t="b.kicker" /></p>
        <h2 id="visit-title" class="section-title"><Bi :t="b.title" /></h2>
        <ul class="contact-list">
          <li>
            <svg class="icon" aria-hidden="true"><use href="#i-pin" /></svg>
            <div>
              <a :href="store.links.map" target="_blank" rel="noopener">
                <template v-for="(line, i) in store.address.en" :key="i"><br v-if="i"><Bi :t="{ en: line, zh: store.address.zh[i] || line }" /></template>
              </a>
            </div>
          </li>
          <li>
            <svg class="icon" aria-hidden="true"><use href="#i-phone" /></svg>
            <a :href="`tel:${store.phoneIntl}`">{{ store.phone }}</a>
          </li>
          <li>
            <svg class="icon" aria-hidden="true"><use href="#i-mail" /></svg>
            <a :href="`mailto:${store.email}`">{{ store.email }}</a>
          </li>
        </ul>
        <h3 class="hours-title">
          <svg class="icon" aria-hidden="true"><use href="#i-clock" /></svg>
          <span lang="en">Hours, all year round</span><span lang="zh">营业时间（全年无休）</span>
        </h3>
        <table class="hours">
          <tbody>
            <tr v-for="([open, close], i) in store.hours" :key="i" :class="{ 'is-today': i === today }">
              <th scope="row"><Bi :t="{ en: DAYS[i][0], zh: DAYS[i][1] }" /></th>
              <td><Bi :t="{ en: `${fmtTime(open, 'en')} – ${fmtTime(close, 'en')}`, zh: `${fmtTime(open, 'zh')} – ${fmtTime(close, 'zh')}` }" /></td>
            </tr>
          </tbody>
        </table>
        <a class="btn btn--primary visit__order" :href="store.links.order" target="_blank" rel="noopener"><span lang="en">Order now</span><span lang="zh">立即点单</span></a>
      </div>
      <div class="visit__visuals">
        <figure class="visit__photo" data-reveal-item>
          <OssImage :media="b.image" sizes="(max-width: 51.25rem) 50vw, 25vw" :widths="[480, 960]" />
          <figcaption><Bi :t="b.caption" /></figcaption>
        </figure>
        <div class="visit__map">
          <iframe :title="`Map to Tea By The Sea, ${store.address.en.slice(1).join(', ')}`" loading="lazy" :src="store.links.mapEmbed" referrerpolicy="no-referrer-when-downgrade" />
          <p class="note note--map"><Bi :t="b.mapNote" /></p>
        </div>
        <div id="get-app" class="visit__apps">
          <p class="visit__apps-label"><Bi :t="b.appsLabel" /></p>
          <AppBadges />
        </div>
      </div>
    </div>
  </section>
</template>
