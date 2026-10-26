// 动效：照片加载渐显、滚动进场、照片视差、首屏照片随鼠标倾斜。行为与旧站 js/main.js 一致。
const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => [...root.querySelectorAll<T>(sel)];

export const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** 照片加载完成后给 .photo-shell 加 is-loaded，CSS 负责渐显 */
export function bindPhotoShells(root: ParentNode = document) {
  $$(".photo-shell", root).forEach((shell) => {
    if (shell.classList.contains("is-loaded")) return;
    const img = shell.querySelector("img");
    const markLoaded = () => shell.classList.add("is-loaded");
    if (!img || (img.complete && img.naturalWidth > 0)) return markLoaded();
    img.addEventListener("load", markLoaded, { once: true });
    img.addEventListener("error", markLoaded, { once: true });
  });
}

/** 滚动进场：每组子元素按阅读顺序错开出现。可重复调用（内容替换后重新绑定）。 */
export function setupReveal(groups: [string, string][]) {
  const targets: HTMLElement[] = [];
  groups.forEach(([groupSel, childSel]) => {
    $$(groupSel).forEach((group) => {
      $$(childSel, group).forEach((el, idx) => {
        el.classList.add("reveal-item");
        el.style.setProperty("--reveal-index", String(idx));
        targets.push(el);
      });
    });
  });
  if (reducedMotion()) {
    targets.forEach((el) => el.classList.add("is-visible"));
    return () => {};
  }
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -8%", threshold: 0.12 }
  );
  targets.filter((el) => !el.classList.contains("is-visible")).forEach((el) => observer.observe(el));
  return () => observer.disconnect();
}

/** 照片视差（只在桌面鼠标设备上） */
export function setupParallax() {
  const items = $$("[data-parallax]");
  if (!items.length || reducedMotion()) return () => {};
  const active = new Set<Element>();
  let raf = 0;
  const isTouchOrMobile = () => window.matchMedia("(max-width: 51.25rem), (pointer: coarse)").matches;
  const reset = () => items.forEach((el) => el.style.setProperty("--parallax-y", "0px"));

  const update = () => {
    raf = 0;
    if (isTouchOrMobile()) return reset();
    const vh = window.innerHeight || 1;
    active.forEach((node) => {
      const el = node as HTMLElement;
      const factor = parseFloat(el.dataset.parallax || "") || 0.08;
      const rect = el.getBoundingClientRect();
      const centerOffset = rect.top + rect.height * 0.5 - vh * 0.5;
      const shift = Math.max(-28, Math.min(28, -centerOffset * factor));
      el.style.setProperty("--parallax-y", `${shift.toFixed(1)}px`);
    });
  };
  const request = () => {
    if (isTouchOrMobile()) return;
    if (!raf && active.size > 0) raf = requestAnimationFrame(update);
  };
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => (e.isIntersecting ? active.add(e.target) : active.delete(e.target)));
      request();
    },
    { rootMargin: "80px 0px" }
  );
  items.forEach((el) => observer.observe(el));
  const onResize = () => (isTouchOrMobile() ? reset() : request());
  window.addEventListener("scroll", request, { passive: true });
  window.addEventListener("resize", onResize, { passive: true });
  return () => {
    observer.disconnect();
    window.removeEventListener("scroll", request);
    window.removeEventListener("resize", onResize);
    cancelAnimationFrame(raf);
  };
}

/** 首屏照片：1.2 秒后定格，桌面鼠标移动时轻微倾斜 */
export function setupHeroTilt() {
  const hero = document.querySelector<HTMLElement>(".hero");
  const photo = document.querySelector<HTMLElement>(".hero__photo");
  if (!hero || !photo) return () => {};
  const settle = setTimeout(() => photo.classList.add("is-settled"), 1200);
  if (reducedMotion()) return () => clearTimeout(settle);
  let frame = 0;
  const onMove = (event: PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const rect = hero.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      photo.style.setProperty("--tilt-x", `${(x * 4.5).toFixed(2)}deg`);
      photo.style.setProperty("--tilt-y", `${(y * -4.5).toFixed(2)}deg`);
    });
  };
  const onLeave = () => {
    photo.style.setProperty("--tilt-x", "0deg");
    photo.style.setProperty("--tilt-y", "0deg");
  };
  hero.addEventListener("pointermove", onMove);
  hero.addEventListener("pointerleave", onLeave);
  return () => {
    clearTimeout(settle);
    cancelAnimationFrame(frame);
    hero.removeEventListener("pointermove", onMove);
    hero.removeEventListener("pointerleave", onLeave);
  };
}

/** 页面就绪：加 is-ready 触发首屏动画 */
export const markReady = () => requestAnimationFrame(() => document.documentElement.classList.add("is-ready"));
