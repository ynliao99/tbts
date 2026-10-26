import type { SiteContent } from "../content/types";

export const DAYS: [string, string][] = [["Sun", "周日"], ["Mon", "周一"], ["Tue", "周二"], ["Wed", "周三"], ["Thu", "周四"], ["Fri", "周五"], ["Sat", "周六"]];

export function fmtTime(mins: number, lang: "en" | "zh") {
  const h = Math.floor(mins / 60), m = mins % 60;
  if (lang === "zh") return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  const h12 = ((h + 11) % 12) + 1;
  return `${h12}${m ? ":" + String(m).padStart(2, "0") : ""}${h < 12 ? "am" : "pm"}`;
}

/** 门店当地时间（America/New_York）的星期和分钟 */
export function storeNow(timeZone = "America/New_York") {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone, weekday: "short", hour: "numeric", minute: "numeric", hourCycle: "h23",
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  return { day: DAYS.findIndex(([en]) => en === get("weekday")), mins: +get("hour") * 60 + +get("minute") };
}

export function openStatus(store: SiteContent["store"]) {
  const now = storeNow(store.timezone);
  const [open, close] = store.hours[now.day];
  if (now.mins >= open && now.mins < close)
    return { state: "open", en: `Open now · until ${fmtTime(close, "en")} today`, zh: `营业中 · 今天营业到 ${fmtTime(close, "zh")}` };
  if (now.mins < open)
    return { state: "closed", en: `Opens today at ${fmtTime(open, "en")}`, zh: `今天 ${fmtTime(open, "zh")} 开门` };
  const next = store.hours[(now.day + 1) % 7][0];
  return { state: "closed", en: `Closed for today · back tomorrow at ${fmtTime(next, "en")}`, zh: `今天已打烊 · 明天 ${fmtTime(next, "zh")} 见` };
}

/** 页脚那行「Daily 11am – 9pm」：每天相同就写 Daily，否则写 See hours */
export function dailyHours(store: SiteContent["store"]) {
  const [o, c] = store.hours[0];
  if (store.hours.every(([a, b]) => a === o && b === c))
    return { en: `Daily ${fmtTime(o, "en")} – ${fmtTime(c, "en")}`, zh: `每天 ${fmtTime(o, "zh")} – ${fmtTime(c, "zh")}` };
  return { en: "Hours vary by day", zh: "每日营业时间不同" };
}

// 去掉描述里英文单词间的连字符（旧站同样处理）
export const cleanCopy = (s = "") => String(s).replace(/(\w)-(\w)/g, "$1 $2");
