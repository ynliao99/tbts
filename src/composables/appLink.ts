import type { SiteContent } from "../content/types";

/** 「下载 App」：手机直达对应商店；识别不到系统（电脑）时留在页内锚点 #get-app。挂载后再改，避免水合不一致。 */
export function bindAppLinks(store: SiteContent["store"], root: ParentNode = document) {
  const href = { ios: store.links.appStore, android: store.links.googlePlay }[document.documentElement.dataset.os || ""];
  if (!href) return;
  root.querySelectorAll<HTMLAnchorElement>("[data-app-link]").forEach((a) => {
    a.href = href;
    a.target = "_blank";
    a.rel = "noopener";
  });
}
