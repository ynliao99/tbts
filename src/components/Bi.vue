<script setup lang="ts">
// 双语文本：两种语言都输出，<html data-lang> 决定显示哪一个。rich 时允许 <br><strong><em>（后端已清洗）。
import type { Bi } from "../content/types";

defineProps<{ t: Bi; rich?: boolean; attrs?: Record<string, string> }>();
</script>

<template>
  <template v-if="rich"><span lang="en" v-bind="attrs" v-html="t.en" /><span lang="zh" v-bind="attrs" v-html="t.zh || t.en" /></template>
  <template v-else><span lang="en" v-bind="attrs">{{ t.en }}</span><span lang="zh" v-bind="attrs">{{ t.zh || t.en }}</span></template>
</template>
