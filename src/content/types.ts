// SiteContent：与 docs/cms-contract.md §2–§3 一一对应
export interface Bi { en: string; zh: string }
export interface Media { id: number | null; url: string; w: number; h: number; alt: Bi }

export interface Tea {
  id: string; name: Bi; desc: Bi; notes: Bi; roast: number; ferment: number; tint: string; image: Media;
}
export interface MenuItem {
  id: number; name: Bi; desc: Bi; price: string; priceCents: number; hasOptions: boolean;
  sizes: { name: Bi; priceCents: number }[]; image: Media | null; tags: string[]; soldOut: boolean;
  /** 点单链接（Chowbus 没有单品链接，目前就是门店点单页）；为空时用 store.links.order */
  orderUrl?: string | null;
}
export interface MenuCategory { slug: string; name: Bi; shortName: Bi | null; items: MenuItem[] }

type Visible = { visible: boolean };
export interface Blocks {
  hero: Visible & { eyebrow: Bi; title: Bi; lede: Bi; proof: { value: string; label: Bi }[]; image: Media; caption: Bi };
  signature: Visible & {
    kicker: Bi; title: Bi; sub: Bi;
    cards: { theme: string; title: Bi; desc: Bi; more: Bi; category: string; image: Media }[];
  };
  tagline: Visible & { kicker: Bi; text: Bi };
  benefits: Visible & { kicker: Bi; title: Bi; cards: { kicker: Bi; title: Bi; body: Bi }[] };
  journey: Visible & { kicker: Bi; title: Bi; sub: Bi; image: Media; caption: Bi; steps: { title: Bi; body: Bi }[] };
  teas: Visible & { kicker: Bi; title: Bi; sub: Bi };
  favs: Visible & { kicker: Bi; title: Bi; note: Bi; categories: { category: string }[] };
  deck: Visible & { kicker: Bi; title: Bi; paragraphs: { body: Bi }[]; photos: { image: Media; caption: Bi }[] };
  press: Visible & { kicker: Bi; title: Bi; body: Bi; image: Media; reviewsLabel: Bi };
  space: Visible & {
    kicker: Bi; title: Bi; body: Bi; tags: { text: Bi }[]; formIntro: Bi;
    image: Media; accentImage: Media; accentCaption: Bi;
  };
  visit: Visible & { kicker: Bi; title: Bi; image: Media; caption: Bi; mapNote: Bi; appsLabel: Bi };
  faq: Visible & { kicker: Bi; title: Bi; sub: Bi; items: { q: Bi; a: Bi }[] };
  finalCta: Visible & { kicker: Bi; title: Bi };
  menuPage: Visible & { kicker: Bi; title: Bi; intro: Bi; footnote: Bi };
}

export interface SiteContent {
  schema: 1;
  version: number;
  publishedAt: string;
  store: {
    name: string; phone: string; phoneIntl: string; email: string;
    address: { en: string[]; zh: string[] };
    hours: [number, number][];
    timezone: string;
    links: {
      order: string; map: string; mapEmbed: string; instagram: string; xiaohongshu: string;
      yelp: string; tripadvisor: string; google: string; appStore: string; googlePlay: string; appStoreId: string;
    };
  };
  seo: { home: { title: Bi; description: Bi }; menu: { title: Bi; description: Bi }; ogImage: Media };
  blocks: Blocks;
  teas: Tea[];
  menu: MenuCategory[];
  toppings: { name: Bi; priceCents: number }[];
}
