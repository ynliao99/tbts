<script setup lang="ts">
// 场地租赁：咨询表单提交到 Vectra（同域 /api/inquiries，nginx 反代），由店员在企业微信里处理；
// 接口不可用时退回旧做法，帮客人生成一封邮件草稿，不丢咨询。
import { computed, ref } from "vue";
import { useContent } from "../../content/useContent";
import { currentLang } from "../../composables/lang";
import Bi from "../Bi.vue";
import OssImage from "../OssImage.vue";

const content = useContent();
const b = computed(() => content.value.blocks.space);
const email = ref("");
const details = ref("");
const website = ref(""); // honeypot，正常用户看不到
const sending = ref(false);
const invalid = ref<"" | "email" | "details">("");
const feedback = ref<{ status: "error" | "success"; en: string; zh: string } | null>(null);
const emailInput = ref<HTMLInputElement>();
const detailsInput = ref<HTMLInputElement>();
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const mailtoHref = computed(() => `mailto:${content.value.store.email}?subject=${encodeURIComponent("Event / space rental inquiry")}`);

const clear = () => { invalid.value = ""; feedback.value = null; };

const draftEmail = () => {
  feedback.value = {
    status: "success",
    en: "Your email draft is ready. Send the message in your mail app and we will reply soon.",
    zh: "咨询邮件已生成，请在邮件应用中点击发送，我们会尽快回复。",
  };
  const subject = encodeURIComponent(`Event inquiry · ${details.value.trim()}`);
  const body = encodeURIComponent(`Reply to: ${email.value.trim()}\nEvent date & group size: ${details.value.trim()}\n\nHi Tea By The Sea team,\n`);
  window.location.href = `mailto:${content.value.store.email}?subject=${subject}&body=${body}`;
};

const submit = async () => {
  if (!email.value.trim() || !emailPattern.test(email.value.trim())) {
    invalid.value = "email";
    emailInput.value?.focus();
    feedback.value = { status: "error", en: "Please enter a valid email address so we can reply to your inquiry.", zh: "请输入有效的联系邮箱，方便我们回复你的场地咨询。" };
    return;
  }
  if (!details.value.trim()) {
    invalid.value = "details";
    detailsInput.value?.focus();
    feedback.value = { status: "error", en: "Please share your preferred date and approximate group size.", zh: "请填写大致的活动日期与人数。" };
    return;
  }
  sending.value = true;
  try {
    const res = await fetch("/api/inquiries", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: email.value.trim(), details: details.value.trim(), lang: currentLang(), website: website.value }),
    });
    if (res.status === 429) {
      feedback.value = { status: "error", en: "Too many inquiries from this network. Please email us directly instead.", zh: "提交太频繁了，请直接发邮件给我们。" };
      return;
    }
    if (!res.ok) throw new Error(String(res.status));
    feedback.value = { status: "success", en: "Thanks! We got your inquiry and will email you soon.", zh: "收到啦！我们会尽快通过邮件回复你。" };
    email.value = "";
    details.value = "";
  } catch {
    draftEmail();
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

        <form class="event-form" novalidate @submit.prevent="submit">
          <div class="event-form__row">
            <label class="event-form__field">
              <span><span lang="en">Your email</span><span lang="zh">联系邮箱</span></span>
              <input
                ref="emailInput" v-model="email" type="email" name="email" required placeholder="you@example.com" autocomplete="email"
                :aria-invalid="invalid === 'email' ? 'true' : undefined" @input="clear"
              >
            </label>
            <label class="event-form__field">
              <span><span lang="en">Date &amp; group size</span><span lang="zh">日期与大致人数</span></span>
              <input
                ref="detailsInput" v-model="details" type="text" name="details" required placeholder="May 18 · 25 guests"
                :aria-invalid="invalid === 'details' ? 'true' : undefined" @input="clear"
              >
            </label>
          </div>
          <input v-model="website" class="visually-hidden" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
          <p v-if="feedback" class="event-form__feedback" :data-status="feedback.status" aria-live="polite"><Bi :t="feedback" /></p>
          <div class="event-form__actions">
            <button class="btn btn--primary" type="submit" :disabled="sending">
              <svg class="icon" aria-hidden="true"><use href="#i-mail" /></svg>
              <span lang="en">Send inquiry</span><span lang="zh">提交咨询</span>
            </button>
            <a class="text-link" :href="mailtoHref"><span lang="en">Email directly</span><span lang="zh">直接发邮件</span></a>
          </div>
        </form>
      </div>
    </div>
  </section>
</template>
