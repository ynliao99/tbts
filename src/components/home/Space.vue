<script setup lang="ts">
// 场地租赁：咨询表单提交到 Vectra（同域 /api/inquiries，nginx 反代），由店员在企业微信里处理；
// 字段按 docs/cms-contract.md 的 POST /inquiries：必填只有邮箱和活动说明，其余选填。
// 接口不可用时退回旧做法，帮客人生成一封邮件草稿，不丢咨询。
import { computed, onMounted, reactive, ref } from "vue";
import { useContent } from "../../content/useContent";
import { currentLang } from "../../composables/lang";
import Bi from "../Bi.vue";
import OssImage from "../OssImage.vue";

type Field = "name" | "email" | "phone" | "eventDate" | "guests" | "details";

const content = useContent();
const b = computed(() => content.value.blocks.space);
const blank = (): Record<Field, string> => ({ name: "", email: "", phone: "", eventDate: "", guests: "", details: "" });
const form = reactive(blank());
const website = ref(""); // honeypot，正常用户看不到
const sending = ref(false);
const sent = ref(false);
const invalid = ref<Field | "">("");
const feedback = ref<{ status: "error" | "success"; en: string; zh: string } | null>(null);
const inputs: Partial<Record<Field, HTMLInputElement | HTMLTextAreaElement>> = {};
const bind = (field: Field) => (el: unknown) => { if (el) inputs[field] = el as HTMLInputElement; };
const today = ref(""); // 日期选择器不让选过去的日子；挂载后再算，避免预渲染时的日期写死进页面
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

onMounted(() => {
  const d = new Date();
  today.value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
});

const mailtoHref = computed(() => `mailto:${content.value.store.email}?subject=${encodeURIComponent("Event / space rental inquiry")}`);

const clear = () => { invalid.value = ""; feedback.value = null; sent.value = false; };

const fail = (field: Field, en: string, zh: string) => {
  invalid.value = field;
  inputs[field]?.focus();
  feedback.value = { status: "error", en, zh };
};

const values = () => Object.fromEntries((Object.keys(form) as Field[]).map((k) => [k, form[k].trim()])) as Record<Field, string>;

const draftEmail = (v: Record<Field, string>) => {
  feedback.value = {
    status: "success",
    en: "Your email draft is ready. Send the message in your mail app and we will reply soon.",
    zh: "咨询邮件已生成，请在邮件应用中点击发送，我们会尽快回复。",
  };
  const lines = [
    `Reply to: ${v.email}`,
    ...(v.name ? [`Name: ${v.name}`] : []),
    ...(v.phone ? [`Phone: ${v.phone}`] : []),
    ...(v.eventDate ? [`Event date: ${v.eventDate}`] : []),
    ...(v.guests ? [`Guests: ${v.guests}`] : []),
    "",
    v.details,
  ];
  const subject = encodeURIComponent(`Event inquiry${v.eventDate ? ` · ${v.eventDate}` : ""}${v.guests ? ` · ${v.guests} guests` : ""}`);
  window.location.href = `mailto:${content.value.store.email}?subject=${subject}&body=${encodeURIComponent(lines.join("\n"))}`;
};

const submit = async () => {
  if (sending.value) return;
  const v = values();
  if (!emailPattern.test(v.email)) {
    return fail("email", "Please enter a valid email address so we can reply to your inquiry.", "请输入有效的联系邮箱，方便我们回复你的场地咨询。");
  }
  if (v.eventDate && today.value && v.eventDate < today.value) {
    return fail("eventDate", "Please pick a date from today onward.", "请选择今天或之后的日期。");
  }
  if (v.guests && !/^[1-9]\d{0,3}$/.test(v.guests)) {
    return fail("guests", "Please enter the number of guests as a whole number.", "人数请填一个整数。");
  }
  if (!v.details) {
    return fail("details", "Please tell us a little about your event.", "请简单介绍一下你的活动。");
  }
  feedback.value = null;
  sending.value = true;
  try {
    const res = await fetch("/api/inquiries", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...v, lang: currentLang(), website: website.value }),
    });
    if (res.status === 429) {
      feedback.value = { status: "error", en: "Too many inquiries from this network. Please email us directly instead.", zh: "提交太频繁了，请直接发邮件给我们。" };
      return;
    }
    if (!res.ok) throw new Error(String(res.status));
    feedback.value = { status: "success", en: "Thanks! We got your inquiry and will email you soon.", zh: "收到啦！我们会尽快通过邮件回复你。" };
    sent.value = true;
    Object.assign(form, blank());
  } catch {
    draftEmail(v);
  } finally {
    sending.value = false;
  }
};
</script>

<template>
  <section v-if="b.visible" id="space" class="space" aria-labelledby="space-title">
    <div class="wrap space__grid">
      <div class="space__media" data-parallax="0.07">
        <div class="photo-shell">
          <OssImage class="space__img" :media="b.image" sizes="(max-width: 51.25rem) 90vw, 50vw" />
        </div>
        <figure class="space__accent-card" aria-hidden="true">
          <div class="photo-shell">
            <OssImage :media="b.accentImage" alt="" sizes="20rem" :widths="[480, 960]" />
          </div>
          <figcaption><Bi :t="b.accentCaption" /></figcaption>
        </figure>
      </div>
      <div class="space__copy">
        <p class="section-kicker"><Bi :t="b.kicker" /></p>
        <h2 id="space-title" class="section-title"><Bi :t="b.title" /></h2>
        <p><Bi :t="b.body" /></p>
        <div class="space__tags" aria-label="Event types">
          <span v-for="(tag, i) in b.tags" :key="i" class="space__tag"><Bi :t="tag.text" /></span>
        </div>
        <p><Bi :t="b.formIntro" /></p>

        <form class="event-form" :class="{ 'is-sending': sending }" novalidate :aria-busy="sending || undefined" @submit.prevent="submit">
          <fieldset class="event-form__fields" :disabled="sending">
            <legend class="visually-hidden"><span lang="en">Event inquiry</span><span lang="zh">活动咨询</span></legend>
            <div class="event-form__row">
              <label class="event-form__field">
                <span><span lang="en">Your name</span><span lang="zh">称呼</span> <small><span lang="en">optional</span><span lang="zh">选填</span></small></span>
                <input :ref="bind('name')" v-model="form.name" type="text" name="name" maxlength="100" autocomplete="name" placeholder="Alex Chen" @input="clear">
              </label>
              <label class="event-form__field">
                <span><span lang="en">Email</span><span lang="zh">联系邮箱</span> <b aria-hidden="true">*</b></span>
                <input
                  :ref="bind('email')" v-model="form.email" type="email" name="email" required maxlength="200" placeholder="you@example.com" autocomplete="email"
                  :aria-invalid="invalid === 'email' ? 'true' : undefined" @input="clear"
                >
              </label>
            </div>
            <div class="event-form__row event-form__row--3">
              <label class="event-form__field">
                <span><span lang="en">Phone</span><span lang="zh">电话</span> <small><span lang="en">optional</span><span lang="zh">选填</span></small></span>
                <input :ref="bind('phone')" v-model="form.phone" type="tel" name="phone" maxlength="50" autocomplete="tel" placeholder="617-555-0123" @input="clear">
              </label>
              <label class="event-form__field">
                <span><span lang="en">Event date</span><span lang="zh">活动日期</span> <small><span lang="en">optional</span><span lang="zh">选填</span></small></span>
                <input
                  :ref="bind('eventDate')" v-model="form.eventDate" type="date" name="eventDate" :min="today || undefined"
                  :aria-invalid="invalid === 'eventDate' ? 'true' : undefined" @input="clear"
                >
              </label>
              <label class="event-form__field">
                <span><span lang="en">Guests</span><span lang="zh">人数</span> <small><span lang="en">optional</span><span lang="zh">选填</span></small></span>
                <input
                  :ref="bind('guests')" v-model="form.guests" type="text" name="guests" maxlength="4" inputmode="numeric" pattern="[0-9]*" placeholder="25"
                  :aria-invalid="invalid === 'guests' ? 'true' : undefined" @input="clear"
                >
              </label>
            </div>
            <label class="event-form__field">
              <span><span lang="en">About your event</span><span lang="zh">活动说明</span> <b aria-hidden="true">*</b></span>
              <textarea
                :ref="bind('details')" v-model="form.details" name="details" required rows="4" maxlength="5000"
                placeholder="Birthday party in the afternoon, about 3 hours, catering for 25…"
                :aria-invalid="invalid === 'details' ? 'true' : undefined" @input="clear"
              />
            </label>
          </fieldset>
          <input v-model="website" class="visually-hidden" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
          <p v-if="feedback" :key="feedback.en" class="event-form__feedback" :data-status="feedback.status" aria-live="polite">
            <svg v-if="sent" class="event-form__check" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="m7 12.5 3.2 3.2L17 9" /></svg>
            <Bi :t="feedback" />
          </p>
          <div class="event-form__actions">
            <button class="btn btn--primary event-form__submit" type="submit" :disabled="sending">
              <span v-if="sending" class="boba-dots" aria-hidden="true"><i /><i /><i /></span>
              <svg v-else class="icon" aria-hidden="true"><use href="#i-mail" /></svg>
              <span v-if="sending"><span lang="en">Sending…</span><span lang="zh">提交中…</span></span>
              <span v-else><span lang="en">Send inquiry</span><span lang="zh">提交咨询</span></span>
            </button>
            <a class="text-link" :href="mailtoHref"><span lang="en">Email directly</span><span lang="zh">直接发邮件</span></a>
          </div>
          <p class="visually-hidden" role="status">{{ sending ? "Sending inquiry… 提交中…" : "" }}</p>
        </form>
      </div>
    </div>
  </section>
</template>
