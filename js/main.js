(() => {
  const { info, teas, menu } = window.TBTS;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  const esc = (s = "") =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  // Clean copy hyphens inside descriptive sentences while keeping both languages in the DOM.
  const cleanCopy = (s = "") => String(s).replace(/(\w)-(\w)/g, "$1 $2");
  const bi = (en, zh) => `<span lang="en">${esc(en)}</span><span lang="zh">${esc(zh || en)}</span>`;

  /* ---------- Photo loading resolve (design-to-motion B2 photo kind) ---------- */
  const bindPhotoShells = (root = document) => {
    $$(".photo-shell", root).forEach((shell) => {
      if (shell.classList.contains("is-loaded")) return;
      const img = $("img", shell);
      if (!img) {
        shell.classList.add("is-loaded");
        return;
      }
      const markLoaded = () => shell.classList.add("is-loaded");
      if (img.complete && img.naturalWidth > 0) {
        markLoaded();
      } else {
        img.addEventListener("load", markLoaded, { once: true });
        img.addEventListener("error", markLoaded, { once: true });
      }
    });
  };

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
    $$("a[href]").forEach((a) => {
      const href = a.getAttribute("href");
      if (!href || href.startsWith("#") || /^(?:mailto:|tel:|javascript:)/i.test(href)) return;
      try {
        const url = new URL(href, window.location.href);
        if (url.origin !== window.location.origin) return;
        url.searchParams.set("lang", lang);
        a.href = url.href;
      } catch {
        /* ignore malformed href */
      }
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
    const closeNav = () => {
      navList.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.setAttribute("aria-label", "Open navigation");
      document.body.classList.remove("nav-open");
    };
    navToggle.addEventListener("click", () => {
      const open = navList.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", open);
      navToggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
      document.body.classList.toggle("nav-open", open);
    });
    navList.addEventListener("click", (e) => {
      if (e.target.closest("a")) closeNav();
    });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeNav(); });
  }

  /* ---------- Nav section scroll-spy ---------- */
  const navSectionLinks = $$("[data-nav-section]");
  if (navSectionLinks.length) {
    const sectionSpy = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const id = entry.target.id;
          navSectionLinks.forEach((link) => {
            if (link.dataset.navSection === id) {
              link.setAttribute("aria-current", "true");
            } else {
              link.removeAttribute("aria-current");
            }
          });
        });
      },
      { rootMargin: "-35% 0px -55% 0px" }
    );
    navSectionLinks.forEach((link) => {
      const target = document.getElementById(link.dataset.navSection);
      if (target) sectionSpy.observe(target);
    });
  }

  /* ---------- Mascot ---------- */
  const mascot = $("[data-mascot]");
  if (mascot) {
    const lines = { en: ["hey there", "boba time?", "nice view, right?", "fresh brewed"], zh: ["嗨，来坐坐", "来一杯？", "风景不错吧", "现泡好茶"] };
    let n = 0, timer;
    mascot.addEventListener("click", () => {
      const lang = document.documentElement.dataset.lang;
      $("[data-mascot-bubble]", mascot).textContent = lines[lang][n++ % lines[lang].length];
      mascot.classList.remove("is-hello");
      void mascot.offsetWidth;
      mascot.classList.add("is-hello");
      clearTimeout(timer);
      timer = setTimeout(() => mascot.classList.remove("is-hello"), 2200);
    });
  }

  /* ---------- Tea explorer (8 bases + elastic spring transition) ---------- */
  const TINTS = {
    "bubble-milk-tea": "#f3dcc3", "jasmine-green": "#eef0b0", "classic-oolong": "#f1c9a8", osmanthus: "#ffe3a3",
    "peach-oolong": "#ffd6c7", "earl-grey": "#f6cdb6", "taiwanese-oolong": "#e9d9c0", hawaii: "#ffd0b3",
  };
  const explorer = $("[data-tea-explorer]");
  if (explorer) {
    const tabs = $("[data-tea-tabs]", explorer);
    const panel = $("[data-tea-panel]", explorer);
    const infoBox = $("[data-tea-info]", explorer);
    const badge = $("[data-tea-badge]", explorer);
    const img = $("[data-tea-img]", explorer);
    const roastBar = $("[data-tea-roast-bar]", explorer);
    const fermentBar = $("[data-tea-ferment-bar]", explorer);

    const meter = (n, icon) =>
      Array.from({ length: 5 }, (_, i) => `<svg class="icon ${i < n ? "is-on" : ""}" aria-hidden="true"><use href="#${icon}"/></svg>`).join("") +
      (n ? `<span class="visually-hidden">${n}/5</span>` : `<span class="meter__none">${bi("Unroasted / 0", "无")}</span>`);

    tabs.innerHTML = teas
      .map((t, i) => `<button class="tea-tab" type="button" role="tab" id="tea-tab-${t.id}" aria-controls="tea-panel"
          aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-i="${i}" style="--tint:${TINTS[t.id]}">
          <span class="tea-tab__en">${esc(t.en)}</span><span class="tea-tab__zh">${esc(t.zh)}</span>
        </button>`)
      .join("");
    panel.id = "tea-panel";

    const prevBtn = $("[data-tea-prev]", explorer);
    const nextBtn = $("[data-tea-next]", explorer);

    const show = (i, animate) => {
      const t = teas[i];
      const num = String(i + 1).padStart(2, "0");
      const total = String(teas.length).padStart(2, "0");
      $$(".tea-tab", tabs).forEach((b, j) => {
        b.setAttribute("aria-selected", i === j);
        b.tabIndex = i === j ? 0 : -1;
      });
      const activeTab = $$(".tea-tab", tabs)[i];
      if (activeTab && tabs.scrollWidth > tabs.clientWidth) {
        activeTab.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      }
      panel.setAttribute("aria-labelledby", `tea-tab-${t.id}`);
      explorer.style.setProperty("--tint", TINTS[t.id]);
      if (badge) badge.innerHTML = bi(`Base ${num} / ${total}`, `茶底 ${num} / ${total}`);
      img.src = t.img;
      img.alt = `${t.en} in a Tea By The Sea cup`;
      $("[data-tea-name]", panel).textContent = t.en;
      $("[data-tea-zh]", panel).textContent = t.zh;
      $("[data-tea-desc]", panel).innerHTML = bi(cleanCopy(t.desc_en), t.desc_zh);
      $("[data-tea-notes]", panel).innerHTML = bi(cleanCopy(t.notes_en), t.notes_zh);
      $("[data-tea-roast]", panel).innerHTML = meter(t.roast, "i-flame");
      $("[data-tea-ferment]", panel).innerHTML = meter(t.ferment, "i-leaf");
      if (roastBar) roastBar.style.setProperty("--level", (t.roast / 5).toFixed(2));
      if (fermentBar) fermentBar.style.setProperty("--level", (t.ferment / 5).toFixed(2));

      if (animate) {
        img.classList.remove("is-pouring");
        panel.classList.remove("is-switching");
        if (infoBox) infoBox.classList.remove("is-switching");
        void img.offsetWidth;
        img.classList.add("is-pouring");
        panel.classList.add("is-switching");
        if (infoBox) infoBox.classList.add("is-switching");
      }
    };
    tabs.addEventListener("click", (e) => {
      const b = e.target.closest(".tea-tab");
      if (b) show(+b.dataset.i, true);
    });
    if (prevBtn) {
      prevBtn.addEventListener("click", () => {
        const cur = $$(".tea-tab", tabs).findIndex((b) => b.getAttribute("aria-selected") === "true");
        const prev = (cur - 1 + teas.length) % teas.length;
        show(prev, true);
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        const cur = $$(".tea-tab", tabs).findIndex((b) => b.getAttribute("aria-selected") === "true");
        const next = (cur + 1) % teas.length;
        show(next, true);
      });
    }

    /* Touch swipe left/right on tea stage for mobile */
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    panel.addEventListener("touchstart", (e) => {
      if (e.touches.length !== 1) return;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchStartTime = Date.now();
    }, { passive: true });
    panel.addEventListener("touchend", (e) => {
      if (!touchStartX) return;
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;
      const dt = Date.now() - touchStartTime;
      touchStartX = 0;
      touchStartY = 0;
      if (dt > 650) return;
      if (Math.abs(deltaX) > 36 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
        const cur = $$(".tea-tab", tabs).findIndex((b) => b.getAttribute("aria-selected") === "true");
        if (deltaX < 0) {
          const next = (cur + 1) % teas.length;
          show(next, true);
        } else {
          const prev = (cur - 1 + teas.length) % teas.length;
          show(prev, true);
        }
      }
    }, { passive: true });
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
  const sticker = (item, withDesc, index = 0) => `<li class="sticker" style="--sticker-index:${index}">
      <div class="sticker__img">
        <div class="photo-shell">
          <img src="${esc(item.img)}" alt="${esc(item.en)}" loading="lazy" width="720" height="900">
        </div>
        <span class="sticker__price">${esc(item.price)}</span>
      </div>
      <p class="sticker__name">${esc(item.en)}</p>
      ${item.zh ? `<p class="sticker__zh">${esc(item.zh)}</p>` : ""}
      ${withDesc && item.desc ? `<p class="sticker__desc">${esc(cleanCopy(item.desc))}</p>` : ""}
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
        return `<button class="chip" type="button" role="tab" aria-selected="${i === 0}" data-cat="${c.id}">${bi(en, zh)}</button>`;
      })
      .join("");
    const render = (id) => {
      const cat = menu.find((c) => c.id === id);
      favGrid.innerHTML = cat.items
        .filter((it) => it.img)
        .slice(0, 8)
        .map((it, idx) => sticker(it, false, idx))
        .join("");
      bindPhotoShells(favGrid);
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
          ? `<ul class="stickers">${c.items.map((it, idx) => sticker(it, true, idx)).join("")}</ul>`
          : `<ul class="menu-list">${c.items
              .map((it) => `<li class="menu-row">
                  <span class="menu-row__name">${esc(it.en)}</span>
                  <span class="menu-row__price">${esc(it.price)}</span>
                  ${it.zh ? `<span class="menu-row__zh">${esc(itemZh(it))}</span>` : ""}
                  ${it.desc ? `<span class="menu-row__desc">${esc(cleanCopy(it.desc))}</span>` : ""}
                </li>`)
              .join("")}</ul>`;
        return `<section class="menu-section" id="cat-${c.id}" data-cat="${c.id}" aria-labelledby="h-${c.id}">
            <h2 class="menu-section__title" id="h-${c.id}">${esc(c.en)} <small>${esc(c.zh)}</small></h2>
            ${body}
          </section>`;
      })
      .join("");
    function itemZh(it) { return it.zh || ""; }
    bindPhotoShells(menuRoot);

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

  /* ---------- Event inquiry form validation (B9 & B10) ---------- */
  const eventForm = $("[data-event-form]");
  if (eventForm) {
    const emailInput = $('input[name="email"]', eventForm);
    const detailsInput = $('input[name="details"]', eventForm);
    const feedback = $("[data-event-feedback]", eventForm);
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const clearInvalid = (input) => input.removeAttribute("aria-invalid");
    [emailInput, detailsInput].filter(Boolean).forEach((input) => {
      input.addEventListener("input", () => {
        clearInvalid(input);
        if (feedback) feedback.hidden = true;
      });
    });

    eventForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = emailInput.value.trim();
      const details = detailsInput.value.trim();

      if (!email || !emailPattern.test(email)) {
        emailInput.setAttribute("aria-invalid", "true");
        emailInput.focus();
        feedback.hidden = false;
        feedback.dataset.status = "error";
        feedback.innerHTML = bi(
          "Please enter a valid email address so we can reply to your inquiry.",
          "请输入有效的联系邮箱，方便我们回复你的场地咨询。"
        );
        return;
      }
      if (!details) {
        detailsInput.setAttribute("aria-invalid", "true");
        detailsInput.focus();
        feedback.hidden = false;
        feedback.dataset.status = "error";
        feedback.innerHTML = bi(
          "Please share your preferred date and approximate group size.",
          "请填写大致的活动日期与人数。"
        );
        return;
      }

      feedback.hidden = false;
      feedback.dataset.status = "success";
      feedback.innerHTML = bi(
        "Your email draft is ready. Send the message in your mail app and we will reply soon.",
        "咨询邮件已生成，请在邮件应用中点击发送，我们会尽快回复。"
      );
      const subject = encodeURIComponent(`Event inquiry · ${details}`);
      const body = encodeURIComponent(`Reply to: ${email}\nEvent date & group size: ${details}\n\nHi Tea By The Sea team,\n`);
      window.location.href = `mailto:${info.email}?subject=${subject}&body=${body}`;
    });
  }

  /* ---------- Motion system ---------- */
  bindPhotoShells(document);
  requestAnimationFrame(() => document.documentElement.classList.add("is-ready"));

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* 1. Heavy gravity scroll reveals with reading-order stagger */
  const revealGroups = [
    ["[data-reveal-section]", ".section-head, [data-reveal-item], .final-cta__inner"],
    [".teas", ".section-head, .tea-explorer"],
    [".favs", ".section-head, .chips, .stickers, .favs__note"],
    ["#deck", ".deck__copy, .collage .snap"],
    [".press", ".press__grid > *"],
    ["#space", ".space__grid > *"],
    ["#visit", ".visit__grid > *"],
    [".menu-hero", ".menu-hero__grid"],
  ];

  const allRevealTargets = [];
  revealGroups.forEach(([groupSel, childSel]) => {
    $$(groupSel).forEach((group) => {
      const children = $$(childSel, group);
      children.forEach((el, idx) => {
        el.classList.add("reveal-item");
        el.style.setProperty("--reveal-index", idx);
        allRevealTargets.push(el);
      });
    });
  });

  if (reducedMotion) {
    allRevealTargets.forEach((el) => el.classList.add("is-visible"));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8%", threshold: 0.12 }
    );
    allRevealTargets.forEach((el) => revealObserver.observe(el));
  }

  /* 2. Mandatory Tagline Word-by-Word Scroll Illumination (B11) */
  const taglineSection = $("[data-tagline-section]");
  if (taglineSection) {
    const allWordSpans = [];
    $$("[data-tagline-copy]", taglineSection).forEach((line) => {
      const text = line.textContent.trim();
      const language = line.getAttribute("lang") || "en";
      let words;
      if (language === "zh" && "Segmenter" in Intl) {
        words = [...new Intl.Segmenter("zh", { granularity: "word" }).segment(text)].map((part) => part.segment);
      } else {
        words = language === "zh" ? [...text] : text.split(/\s+/);
      }
      line.textContent = "";
      words
        .filter((word) => word.trim())
        .forEach((word, index) => {
          const span = document.createElement("span");
          span.className = "tagline-word";
          span.dataset.wordIndex = index;
          span.textContent = word;
          line.append(span);
          allWordSpans.push(span);
        });
    });

    if (reducedMotion) {
      allWordSpans.forEach((w) => w.classList.add("is-lit"));
    } else {
      // Per-word IntersectionObserver + reading-order cascade as words cross the viewport trigger line
      const wordObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const span = entry.target;
            const idx = +span.dataset.wordIndex || 0;
            setTimeout(() => span.classList.add("is-lit"), idx * 38);
            wordObserver.unobserve(span);
          });
        },
        { rootMargin: "0px 0px -24% 0px", threshold: 0.2 }
      );
      allWordSpans.forEach((w) => wordObserver.observe(w));
    }
  }

  /* 3. Design-to-Motion Website Section: Card Intro + Offscreen-Paused Story Loops */
  const motionSection = $("[data-motion-section]");
  if (motionSection) {
    const cards = $$("[data-motion-card]", motionSection);
    cards.forEach((c, idx) => c.style.setProperty("--card-index", idx));

    const tempEl = $("[data-story-temp]", motionSection);
    const pctEl = $("[data-story-pct]", motionSection);
    const barEl = $("[data-story-bar]", motionSection);
    const aromaChips = $$("[data-aroma-chip]", motionSection);
    const sweetPills = $$("[data-story-sweet] .dial-pill", motionSection);
    const icePills = $$("[data-story-ice] .dial-pill", motionSection);
    const orderEl = $("[data-story-order]", motionSection);
    const routePath = $("#harbor-route", motionSection);
    const ferryDot = $("[data-story-ferry]", motionSection);

    const DIAL_STATES = [
      { sweet: 1, ice: 0, en: "50% sweet · Less ice · Fresh fruit", zh: "半糖 · 少冰 · 鲜果现切" },
      { sweet: 0, ice: 1, en: "30% sweet · No ice · Loose leaf oolong", zh: "三分糖 · 去冰 · 现泡乌龙" },
      { sweet: 2, ice: 2, en: "70% sweet · Warm · House milk tea", zh: "七分糖 · 温热 · 经典珍奶" },
    ];
    const STEEP_STATES = [
      { chip: 0, temp: "90°C", pct: "92%", scale: 0.92 },
      { chip: 1, temp: "94°C", pct: "96%", scale: 0.96 },
      { chip: 2, temp: "92°C", pct: "94%", scale: 0.94 },
    ];

    if (reducedMotion) {
      cards.forEach((c) => c.classList.add("is-in"));
    } else {
      let storiesRunning = false;
      let rafId = 0;
      let loopTime = 0;
      let lastTs = 0;
      let lastBeat = -1;
      const routeLen = routePath && routePath.getTotalLength ? routePath.getTotalLength() : 0;

      const tickStories = (ts) => {
        if (!storiesRunning) return;
        if (!lastTs) lastTs = ts;
        const dt = Math.min(0.1, (ts - lastTs) / 1000);
        lastTs = ts;
        loopTime += dt;

        // Beat every 2.2 seconds, offset between cards
        const beat = Math.floor(loopTime / 2.2);
        if (beat !== lastBeat) {
          lastBeat = beat;
          const steep = STEEP_STATES[beat % STEEP_STATES.length];
          aromaChips.forEach((chip, idx) => chip.classList.toggle("is-active", idx === steep.chip));
          if (tempEl) tempEl.textContent = steep.temp;
          if (pctEl) pctEl.textContent = steep.pct;
          if (barEl) barEl.style.transform = `scaleX(${steep.scale})`;

          const dial = DIAL_STATES[(beat + 1) % DIAL_STATES.length];
          sweetPills.forEach((p, idx) => p.classList.toggle("is-active", idx === dial.sweet));
          icePills.forEach((p, idx) => p.classList.toggle("is-active", idx === dial.ice));
          if (orderEl) orderEl.innerHTML = bi(dial.en, dial.zh);
        }

        // Smooth ferry glide along harbor connector path
        if (routeLen && ferryDot) {
          const progress = 0.5 - 0.5 * Math.cos((loopTime / 5.4) * Math.PI * 2);
          const pt = routePath.getPointAtLength(progress * routeLen);
          ferryDot.setAttribute("cx", pt.x.toFixed(1));
          ferryDot.setAttribute("cy", pt.y.toFixed(1));
        }

        rafId = requestAnimationFrame(tickStories);
      };

      const sectionObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              cards.forEach((c) => c.classList.add("is-in"));
              if (!storiesRunning) {
                storiesRunning = true;
                lastTs = 0;
                rafId = requestAnimationFrame(tickStories);
              }
            } else {
              storiesRunning = false;
              cancelAnimationFrame(rafId);
            }
          });
        },
        { threshold: 0.25 }
      );
      sectionObserver.observe(motionSection);
    }
  }

  /* 4. Subtle Photo Parallax (IntersectionObserver + rAF, desktop mouse-only for instant native mobile feel) */
  const parallaxItems = $$("[data-parallax]");
  const heroPhoto = $(".hero__photo");
  if (heroPhoto) {
    setTimeout(() => {
      heroPhoto.classList.add("is-settled");
    }, 1200);
  }

  if (parallaxItems.length && !reducedMotion) {
    const activeParallax = new Set();
    let parallaxRaf = 0;
    const isTouchOrMobile = () =>
      window.matchMedia("(max-width: 51.25rem), (pointer: coarse)").matches;

    const updateParallax = () => {
      parallaxRaf = 0;
      if (isTouchOrMobile()) {
        parallaxItems.forEach((el) => el.style.setProperty("--parallax-y", "0px"));
        return;
      }
      const vh = window.innerHeight || 1;
      activeParallax.forEach((el) => {
        const factor = parseFloat(el.dataset.parallax) || 0.08;
        const rect = el.getBoundingClientRect();
        const centerOffset = rect.top + rect.height * 0.5 - vh * 0.5;
        const shift = Math.max(-28, Math.min(28, -centerOffset * factor));
        el.style.setProperty("--parallax-y", `${shift.toFixed(1)}px`);
      });
    };

    const requestParallax = () => {
      if (isTouchOrMobile()) return;
      if (!parallaxRaf && activeParallax.size > 0) {
        parallaxRaf = requestAnimationFrame(updateParallax);
      }
    };

    const parallaxObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            activeParallax.add(entry.target);
          } else {
            activeParallax.delete(entry.target);
          }
        });
        requestParallax();
      },
      { rootMargin: "80px 0px" }
    );

    parallaxItems.forEach((el) => parallaxObserver.observe(el));
    window.addEventListener("scroll", requestParallax, { passive: true });
    window.addEventListener("resize", () => {
      if (isTouchOrMobile()) {
        parallaxItems.forEach((el) => el.style.setProperty("--parallax-y", "0px"));
      } else {
        requestParallax();
      }
    }, { passive: true });
  }

  /* 5. Hero 3D Pointer Tilt (desktop mouse only) */
  const hero = $(".hero");
  if (heroPhoto && hero && !reducedMotion) {
    let tiltFrame;
    hero.addEventListener("pointermove", (event) => {
      if (event.pointerType !== "mouse") return;
      cancelAnimationFrame(tiltFrame);
      tiltFrame = requestAnimationFrame(() => {
        const rect = hero.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        heroPhoto.style.setProperty("--tilt-x", `${(x * 4.5).toFixed(2)}deg`);
        heroPhoto.style.setProperty("--tilt-y", `${(y * -4.5).toFixed(2)}deg`);
      });
    });
    hero.addEventListener("pointerleave", () => {
      heroPhoto.style.setProperty("--tilt-x", "0deg");
      heroPhoto.style.setProperty("--tilt-y", "0deg");
    });
  }
})();
