<script setup lang="ts">
import { useContent } from "../content/useContent";
import { usePageSeo } from "../composables/seo";
import PageShell from "../components/PageShell.vue";

const content = useContent();
usePageSeo({
  path: "/privacy",
  title: () => ({ en: "Privacy · Tea By The Sea", zh: "隐私说明 · Tea By The Sea" }),
  description: () => ({ en: "Privacy information for the Tea By The Sea website.", zh: "Tea By The Sea 网站隐私说明。" }),
});
</script>

<template>
  <PageShell page="legal" main-class="legal-page">
    <article class="wrap legal-page__inner">
      <h1><span lang="en">Privacy</span><span lang="zh">隐私说明</span></h1>
      <p><span lang="en">Last updated October 26, 2026.</span><span lang="zh">最后更新：2026 年 10 月 26 日。</span></p>
      <h2><span lang="en">What this site collects</span><span lang="zh">本站收集什么</span></h2>
      <p><span lang="en">This website does not create user accounts and does not collect payment information. If you send an event inquiry, we keep the email address and event details you enter so our staff can reply. If you contact us by email or phone, you choose what information to share with us.</span><span lang="zh">本网站不创建用户账户，也不收集付款信息。提交活动咨询时，我们会保存你填写的邮箱和活动信息，供店员回复使用。通过邮件或电话联系我们时，你可以自行决定提供哪些信息。</span></p>
      <h2><span lang="en">External services</span><span lang="zh">第三方服务</span></h2>
      <p><span lang="en">The site links to Chowbus for ordering and embeds Google Maps for directions. Those services may process information under their own privacy policies.</span><span lang="zh">本站使用 Chowbus 完成在线点单，并嵌入 Google Maps 提供路线。相关服务可能依据各自隐私政策处理信息。</span></p>
      <h2><span lang="en">Contact</span><span lang="zh">联系我们</span></h2>
      <p><a :href="`mailto:${content.store.email}`">{{ content.store.email }}</a></p>
    </article>
  </PageShell>
</template>
