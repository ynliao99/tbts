(() => {
  const { info, teas, menu } = window.TBTS;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  const esc = (s = "") =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  // Both languages are always in the DOM; CSS hides the inactive one.
  const bi = (en, zh) => `<span lang="en">${esc(en)}</span><span lang="zh">${esc(zh || en)}</span>`;

  /* ---------- Language ---------- */
  const LANG_KEY = "tbts-lang";
  const storage = {
    get() { try { return localStorage.getItem(LANG_KEY); } catch { return null; } },
    set(v) { try { localStorage.setItem(LANG_KEY, v); } catch { /* private mode */ } },
  };
  const normalizeLang = (value = "") => {
    const lang = String(value).toLowerCase();
    if (lang === "zh" || lang === "cn" || lang.startsWith("zh-")) return "zh";
    if (lang === "en" || lang.startsWith("en-")) return "en";
    return null;
  };
  const syncLangLinks = (lang) => {
    $$('a[href]').forEach((a) => {
      const href = a.getAttribute("href");
      if (!href || /^(?:mailto:|tel:|javascript:)/i.test(href)) return;
      const url = new URL(href, window.location.href);
      if (url.origin !== window.location.origin) return;
      url.searchParams.set("lang", lang);
      a.href = url.href;
    });
  };
  const setLang = (lang) => {
    document.documentElement.dataset.lang = lang;
    document.documentElement.lang = lang === "zh" ? "zh-Hans" : "en";
    storage.set(lang);
    const url = new URL(window.location.href);
    url.searchParams.set("lang", lang);
    history.replaceState(null, "", url);
    syncLangLinks(lang);
  };
  const urlLang = normalizeLang(new URLSearchParams(window.location.search).get("lang"));
  setLang(urlLang || normalizeLang(storage.get()) || normalizeLang(navigator.language) || "en");
  $$("[data-lang-switch]").forEach((btn) =>
    btn.addEventListener("click", () => setLang(document.documentElement.dataset.lang === "zh" ? "en" : "zh"))
  );

  /* ---------- Shared store info ---------- */
  const setLinks = (sel, href, external) =>
    $$(sel).forEach((a) => {
      a.href = href;
      if (external) { a.target = "_blank"; a.rel = "noopener"; }
    });
  setLinks("[data-order]", info.orderUrl, true);
  setLinks("[data-map-link]", info.mapUrl, true);
  setLinks('[data-review="google"]', info.mapUrl, true);
  setLinks("[data-instagram]", info.instagram, true);
  setLinks("[data-xhs]", info.xiaohongshu, true);
  $$("[data-phone]").forEach((a) => { a.href = `tel:${info.phoneIntl}`; a.textContent = info.phone; });
  $$("[data-email]").forEach((a) => { a.href = `mailto:${info.email}`; a.textContent = info.email; });
  $$("[data-email-space]").forEach((a) => {
    a.href = `mailto:${info.email}?subject=${encodeURIComponent("Event / space rental inquiry")}`;
  });
  $$("[data-address]").forEach((el) => {
    el.innerHTML = info.address_en.map((line, i) => bi(line, info.address_zh[i])).join("<br>");
  });
  $$("[data-address-plain]").forEach((el) => { el.innerHTML = info.address_en.slice(1).map(esc).join("<br>"); });
  $$("[data-year]").forEach((el) => { el.textContent = new Date().getFullYear(); });

  /* ---------- Hours & open status (store time, America/New_York) ---------- */
  const DAYS = [["Sun", "周日"], ["Mon", "周一"], ["Tue", "周二"], ["Wed", "周三"], ["Thu", "周四"], ["Fri", "周五"], ["Sat", "周六"]];
  const fmt = (mins, lang) => {
    const h = Math.floor(mins / 60), m = mins % 60;
    if (lang === "zh") return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    const h12 = ((h + 11) % 12) + 1;
    return `${h12}${m ? ":" + String(m).padStart(2, "0") : ""}${h < 12 ? "am" : "pm"}`;
  };
  const storeNow = () => {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York", weekday: "short", hour: "numeric", minute: "numeric", hourCycle: "h23",
    }).formatToParts(new Date());
    const get = (t) => parts.find((p) => p.type === t).value;
    return { day: DAYS.findIndex(([en]) => en === get("weekday")), mins: +get("hour") * 60 + +get("minute") };
  };
  const now = storeNow();

  $$("[data-hours]").forEach((table) => {
    table.innerHTML = info.hours
      .map(([open, close], i) => `<tr class="${i === now.day ? "is-today" : ""}">
          <th scope="row">${bi(DAYS[i][0], DAYS[i][1])}</th>
          <td>${bi(`${fmt(open, "en")} – ${fmt(close, "en")}`, `${fmt(open, "zh")} – ${fmt(close, "zh")}`)}</td>
        </tr>`)
      .join("");
  });

  $$("[data-open-status]").forEach((el) => {
    const [open, close] = info.hours[now.day];
    const isOpen = now.mins >= open && now.mins < close;
    el.dataset.state = isOpen ? "open" : "closed";
    el.innerHTML = isOpen
      ? bi(`Open now · until ${fmt(close, "en")} today`, `营业中 · 今天营业到 ${fmt(close, "zh")}`)
      : now.mins < open
        ? bi(`Opens today at ${fmt(open, "en")}`, `今天 ${fmt(open, "zh")} 开门`)
        : bi(`Closed for today · back tomorrow at ${fmt(info.hours[(now.day + 1) % 7][0], "en")}`,
             `今天已打烊 · 明天 ${fmt(info.hours[(now.day + 1) % 7][0], "zh")} 见`);
  });

  /* ---------- Mobile nav ---------- */
  const navToggle = $(".nav__toggle");
  const navList = $("#nav-list");
  if (navToggle && navList) {
    navToggle.addEventListener("click", () => {
      const open = navList.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", open);
    });
    navList.addEventListener("click", (e) => {
      if (e.target.closest("a")) { navList.classList.remove("is-open"); navToggle.setAttribute("aria-expanded", "false"); }
    });
  }

  /* ---------- Mascot ---------- */
  const mascot = $("[data-mascot]");
  if (mascot) {
    const lines = { en: ["hey!", "boba?", "nice view, right?", "sip sip"], zh: ["嗨！", "来一杯？", "风景不错吧", "吨吨吨"] };
    let n = 0, timer;
    mascot.addEventListener("click", () => {
      const lang = document.documentElement.dataset.lang;
      $("[data-mascot-bubble]", mascot).textContent = lines[lang][n++ % lines[lang].length];
      mascot.classList.remove("is-hello");
      void mascot.offsetWidth; // restart the hop
      mascot.classList.add("is-hello");
      clearTimeout(timer);
      timer = setTimeout(() => mascot.classList.remove("is-hello"), 2000);
    });
  }

  /* ---------- Tea explorer ---------- */
  const TINTS = {
    "bubble-milk-tea": "#f3dcc3", "jasmine-green": "#eef0b0", "classic-oolong": "#f1c9a8", osmanthus: "#ffe3a3",
    "peach-oolong": "#ffd6c7", "earl-grey": "#f6cdb6", "taiwanese-oolong": "#e9d9c0", hawaii: "#ffd0b3",
  };
  const explorer = $("[data-tea-explorer]");
  if (explorer) {
    const tabs = $("[data-tea-tabs]", explorer);
    const panel = $("[data-tea-panel]", explorer);
    const img = $("[data-tea-img]", explorer);
    const meter = (n, icon) =>
      Array.from({ length: 5 }, (_, i) => `<svg class="icon ${i < n ? "is-on" : ""}" aria-hidden="true"><use href="#${icon}"/></svg>`).join("") +
      (n ? `<span class="visually-hidden">${n}/5</span>` : `<span class="meter__none">${bi("none", "无")}</span>`);

    tabs.innerHTML = teas
      .map((t, i) => `<button class="tea-tab" role="tab" id="tea-tab-${t.id}" aria-controls="tea-panel"
          aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-i="${i}" style="--tint:${TINTS[t.id]}">
          <span class="tea-tab__en">${esc(t.en)}</span><span class="tea-tab__zh">${esc(t.zh)}</span>
        </button>`)
      .join("");
    panel.id = "tea-panel";

    const show = (i, animate) => {
      const t = teas[i];
      $$(".tea-tab", tabs).forEach((b, j) => {
        b.setAttribute("aria-selected", i === j);
        b.tabIndex = i === j ? 0 : -1;
      });
      panel.setAttribute("aria-labelledby", `tea-tab-${t.id}`);
      explorer.style.setProperty("--tint", TINTS[t.id]);
      img.src = t.img;
      img.alt = `${t.en} in a Tea By The Sea cup`;
      $("[data-tea-name]", panel).textContent = t.en;
      $("[data-tea-zh]", panel).textContent = t.zh;
      $("[data-tea-desc]", panel).innerHTML = bi(t.desc_en, t.desc_zh);
      $("[data-tea-notes]", panel).innerHTML = bi(t.notes_en, t.notes_zh);
      $("[data-tea-roast]", panel).innerHTML = meter(t.roast, "i-flame");
      $("[data-tea-ferment]", panel).innerHTML = meter(t.ferment, "i-leaf");
      if (animate) {
        img.classList.remove("is-pouring");
        void img.offsetWidth;
        img.classList.add("is-pouring");
      }
    };
    tabs.addEventListener("click", (e) => {
      const b = e.target.closest(".tea-tab");
      if (b) show(+b.dataset.i, true);
    });
    tabs.addEventListener("keydown", (e) => {
      const keys = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };
      if (!(e.key in keys)) return;
      e.preventDefault();
      const cur = $$(".tea-tab", tabs).findIndex((b) => b.getAttribute("aria-selected") === "true");
      const next = (cur + keys[e.key] + teas.length) % teas.length;
      show(next, true);
      $$(".tea-tab", tabs)[next].focus();
    });
    show(0, false);
  }

  /* ---------- Sticker cards ---------- */
  const sticker = (item, withDesc) => `<li class="sticker">
      <div class="sticker__img">
        <img src="${esc(item.img)}" alt="${esc(item.en)}" loading="lazy" width="720" height="900">
        <span class="sticker__price">${esc(item.price)}</span>
      </div>
      <p class="sticker__name">${esc(item.en)}</p>
      ${item.zh ? `<p class="sticker__zh">${esc(item.zh)}</p>` : ""}
      ${withDesc && item.desc ? `<p class="sticker__desc">${esc(item.desc)}</p>` : ""}
    </li>`;

  /* ---------- Home: favorites ---------- */
  const favChips = $("[data-fav-chips]");
  const favGrid = $("[data-fav-grid]");
  if (favChips && favGrid) {
    const FAV_CATS = ["milk-tea", "smoothie", "fruit-tea", "coconut", "matcha", "taro", "yakult"];
    const cats = FAV_CATS.map((id) => menu.find((c) => c.id === id)).filter(Boolean);
    const shortName = { "Cheese Foam / Fruit Tea Smoothie": ["Cheese foam smoothies", "芝芝 / 满杯"] };
    favChips.innerHTML = cats
      .map((c, i) => {
        const [en, zh] = shortName[c.en] || [c.en, c.zh];
        return `<button class="chip" role="tab" aria-selected="${i === 0}" data-cat="${c.id}">${bi(en, zh)}</button>`;
      })
      .join("");
    const render = (id) => {
      const cat = menu.find((c) => c.id === id);
      favGrid.innerHTML = cat.items.filter((it) => it.img).slice(0, 8).map((it) => sticker(it, false)).join("");
    };
    favChips.addEventListener("click", (e) => {
      const chip = e.target.closest(".chip");
      if (!chip) return;
      $$(".chip", favChips).forEach((c) => c.setAttribute("aria-selected", c === chip));
      render(chip.dataset.cat);
    });
    render(cats[0].id);
  }

  /* ---------- Menu page ---------- */
  const menuRoot = $("[data-menu]");
  if (menuRoot) {
    const chips = $("[data-menu-chips]");
    const search = $("[data-menu-search]");
    const empty = $("[data-menu-empty]");

    chips.innerHTML = menu
      .map((c) => `<a class="chip" href="#cat-${c.id}" data-cat="${c.id}">${bi(c.en, c.zh)}</a>`)
      .join("");

    menuRoot.innerHTML = menu
      .map((c) => {
        const photo = c.items.some((it) => it.img);
        const body = photo
          ? `<ul class="stickers">${c.items.map((it) => sticker(it, true)).join("")}</ul>`
          : `<ul class="menu-list">${c.items
              .map((it) => `<li class="menu-row">
                  <span class="menu-row__name">${esc(it.en)}</span>
                  <span class="menu-row__price">${esc(it.price)}</span>
                  ${it.zh ? `<span class="menu-row__zh">${esc(it.zh)}</span>` : ""}
                  ${it.desc ? `<span class="menu-row__desc">${esc(it.desc)}</span>` : ""}
                </li>`)
              .join("")}</ul>`;
        return `<section class="menu-section" id="cat-${c.id}" data-cat="${c.id}" aria-labelledby="h-${c.id}">
            <h2 class="menu-section__title" id="h-${c.id}">${esc(c.en)} <small>${esc(c.zh)}</small></h2>
            ${body}
          </section>`;
      })
      .join("");

    // Highlight the chip of the section being read.
    const chipFor = (id) => $(`.chip[data-cat="${id}"]`, chips);
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          $$(".chip", chips).forEach((c) => c.removeAttribute("aria-current"));
          const chip = chipFor(en.target.dataset.cat);
          if (chip) {
            chip.setAttribute("aria-current", "true");
            chip.scrollIntoView({ block: "nearest", inline: "nearest" });
          }
        });
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );
    $$(".menu-section", menuRoot).forEach((s) => spy.observe(s));

    search.addEventListener("input", () => {
      const q = search.value.trim().toLowerCase();
      let shown = 0;
      $$(".menu-section", menuRoot).forEach((sec) => {
        let secShown = 0;
        $$(".sticker, .menu-row", sec).forEach((li) => {
          const hit = !q || li.textContent.toLowerCase().includes(q);
          li.hidden = !hit;
          if (hit) secShown++;
        });
        sec.hidden = secShown === 0;
        shown += secShown;
      });
      empty.hidden = shown > 0;
    });
  }
})();
