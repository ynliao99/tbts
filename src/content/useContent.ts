import { inject, onMounted, provide, shallowRef, type InjectionKey, type ShallowRef } from "vue";
import fallback from "./fallback.json";
import type { SiteContent } from "./types";

// 打包时预渲染用 fallback.json（scripts/fetch-content.mjs 拉下来的线上快照）；
// 浏览器里再读同域 /content/site.json，版本更新就替换，CMS 发布不用重新打包。
// ?preview=<token> 时改读草稿预览（/api/content/preview，nginx 反代到 Vectra）。
const KEY: InjectionKey<ShallowRef<SiteContent>> = Symbol("content");
const PREVIEW_KEY: InjectionKey<ShallowRef<boolean>> = Symbol("preview");

const isContent = (v: unknown): v is SiteContent =>
  !!v && typeof v === "object" && (v as SiteContent).schema === 1 && Array.isArray((v as SiteContent).menu);

export function provideContent() {
  const content = shallowRef(fallback as unknown as SiteContent);
  const preview = shallowRef(false);
  provide(KEY, content);
  provide(PREVIEW_KEY, preview);

  onMounted(async () => {
    const token = new URLSearchParams(location.search).get("preview");
    const url = token ? `/api/content/preview?token=${encodeURIComponent(token)}` : "/content/site.json";
    try {
      const res = await fetch(url, { cache: "no-cache" });
      if (!res.ok) return;
      const body = await res.json();
      const next = isContent(body) ? body : isContent(body?.data) ? body.data : null;
      if (!next) return;
      if (token) preview.value = true;
      if (token || next.version > content.value.version) content.value = next;
    } catch {
      /* 离线或接口不可用时保留预渲染内容 */
    }
  });
}

export function useContent() {
  return inject(KEY)!;
}

export function usePreviewMode() {
  return inject(PREVIEW_KEY)!;
}
