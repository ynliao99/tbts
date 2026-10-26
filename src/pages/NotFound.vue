<script setup lang="ts">
import { onMounted } from "vue";
import { useHead } from "@unhead/vue";
import { markReady } from "../composables/motion";

useHead({ title: "Page not found · Tea By The Sea", meta: [{ name: "robots", content: "noindex" }] });
onMounted(markReady);
</script>

<template>
  <main class="not-found">
    <div>
      <img src="/assets/img/brand/logo.webp" alt="Tea By The Sea" width="96" height="96">
      <h1>404</h1>
      <h2><span lang="en">That cup drifted away.</span><span lang="zh">这一杯漂走了。</span></h2>
      <p><span lang="en">The page is not here, but the tea and the harbor view still are.</span><span lang="zh">页面不在这里，不过茶和海景都还在。</span></p>
      <a class="btn btn--primary" href="/"><span lang="en">Return to Tea By The Sea</span><span lang="zh">回到 Tea By The Sea</span></a>
    </div>
  </main>
</template>
