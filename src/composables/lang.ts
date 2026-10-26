// 中英切换：<html data-lang> 决定显示哪种语言（两种文案都在 DOM 里，CSS 隐藏另一种）。
// 首屏语言由 index.html 里的内联脚本先定好，这里负责切换、记住选择，并把 ?lang= 同步到地址栏和站内链接。
const LANG_KEY = "tbts-lang";
export type Lang = "en" | "zh";

export const currentLang = (): Lang => (document.documentElement.dataset.lang === "zh" ? "zh" : "en");

export function syncLangLinks(lang: Lang = currentLang()) {
  document.querySelectorAll<HTMLAnchorElement>("a[href]").forEach((a) => {
    const href = a.getAttribute("href");
    if (!href || href.startsWith("#") || /^(?:mailto:|tel:|javascript:)/i.test(href)) return;
    try {
      const url = new URL(href, location.href);
      if (url.origin !== location.origin) return;
      url.searchParams.set("lang", lang);
      a.href = url.href;
    } catch {
      /* ignore malformed href */
    }
  });
}

export function setLang(lang: Lang) {
  const root = document.documentElement;
  root.dataset.lang = lang;
  root.lang = lang === "zh" ? "zh-Hans" : "en";
  try { localStorage.setItem(LANG_KEY, lang); } catch { /* private mode */ }
  const url = new URL(location.href);
  url.searchParams.set("lang", lang);
  history.replaceState(history.state, "", url);
  syncLangLinks(lang);
}

export const toggleLang = () => setLang(currentLang() === "zh" ? "en" : "zh");
