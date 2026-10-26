<script setup lang="ts">
import { useContent } from "../content/useContent";
import { usePageSeo } from "../composables/seo";
import PageShell from "../components/PageShell.vue";

const content = useContent();
usePageSeo({
  path: "/terms",
  title: () => ({ en: "Terms · Tea By The Sea", zh: "网站条款 · Tea By The Sea" }),
  description: () => ({ en: "Terms for using the Tea By The Sea website.", zh: "Tea By The Sea 网站使用条款。" }),
});
</script>

<template>
  <PageShell page="legal" main-class="legal-page">
    <article class="wrap legal-page__inner">
      <h1><span lang="en">Terms</span><span lang="zh">网站条款</span></h1>
      <p><span lang="en">Last updated October 25, 2026.</span><span lang="zh">最后更新：2026 年 10 月 25 日。</span></p>
      <h2><span lang="en">Website information</span><span lang="zh">网站信息</span></h2>
      <p><span lang="en">We work to keep menu, price, hour and location information accurate. Current availability and prices on the online ordering service take priority if information differs.</span><span lang="zh">我们会尽力确保菜单、价格、营业时间和地址准确。如有差异，以在线点单服务中的最新供应情况和价格为准。</span></p>
      <h2><span lang="en">External links</span><span lang="zh">外部链接</span></h2>
      <p><span lang="en">Ordering, maps, reviews and social links open services operated by other companies. Their terms apply when you use those services.</span><span lang="zh">点单、地图、评价和社交媒体链接由其他公司运营，使用相关服务时需遵守其条款。</span></p>
      <h2><span lang="en">Contact</span><span lang="zh">联系我们</span></h2>
      <p><a :href="`mailto:${content.store.email}`">{{ content.store.email }}</a></p>
    </article>
  </PageShell>
</template>
