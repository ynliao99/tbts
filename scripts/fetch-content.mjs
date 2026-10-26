#!/usr/bin/env node
// 准备打包用的内容快照 src/content/fallback.json：
//   node scripts/fetch-content.mjs              从线上 /content/site.json 拉取已发布快照（拉不到就失败，部署用）
//   node scripts/fetch-content.mjs --legacy     用 content/legacy-snapshot.json（CMS 上线前的初版）
//   node scripts/fetch-content.mjs --if-missing 本地开发：文件已存在就不动，否则先试线上、再退回初版
import { copyFileSync, existsSync, writeFileSync } from "node:fs";

const root = new URL("..", import.meta.url).pathname;
const out = root + "src/content/fallback.json";
const legacy = root + "content/legacy-snapshot.json";
const url = process.env.TBTS_CONTENT_URL || "https://teabytheseaboston.com/content/site.json";
const mode = process.argv[2] || "";

const useLegacy = (why) => {
  copyFileSync(legacy, out);
  console.log(`fallback.json ← content/legacy-snapshot.json (${why})`);
};

if (mode === "--if-missing" && existsSync(out)) process.exit(0);
if (mode === "--legacy") {
  useLegacy("--legacy");
  process.exit(0);
}

try {
  const res = await fetch(url, { headers: { "cache-control": "no-cache" } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const body = await res.json();
  if (body?.schema !== 1 || !Array.isArray(body.menu) || !body.blocks) throw new Error("not a SiteContent snapshot");
  writeFileSync(out, JSON.stringify(body));
  console.log(`fallback.json ← ${url} (version ${body.version})`);
} catch (err) {
  if (mode === "--if-missing") useLegacy(`${url}: ${err.message}`);
  else {
    console.error(`拉取 ${url} 失败：${err.message}。确认要用初版内容就加 --legacy。`);
    process.exit(1);
  }
}
