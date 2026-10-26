import { computed } from "vue";
import { useHead } from "@unhead/vue";
import type { Bi, Media } from "../content/types";

const SITE = "https://teabytheseaboston.com";

/** 标题和描述用英文（搜索引擎和分享卡片），中文由页面内容覆盖 */
export function usePageSeo(opts: { path: string; title: () => Bi; description?: () => Bi; image?: () => Media; noindex?: boolean }) {
  const abs = (url: string) => (url.startsWith("http") ? url : SITE + url);
  useHead({
    title: computed(() => opts.title().en),
    link: [{ rel: "canonical", href: SITE + opts.path }],
    meta: computed(() => [
      ...(opts.description ? [
        { name: "description", content: opts.description().en },
        { property: "og:description", content: opts.description().en },
      ] : []),
      { property: "og:title", content: opts.title().en },
      { property: "og:url", content: SITE + opts.path },
      ...(opts.image ? [{ property: "og:image", content: abs(opts.image().url) }] : []),
      ...(opts.noindex ? [{ name: "robots", content: "noindex" }] : []),
    ]),
  });
}
