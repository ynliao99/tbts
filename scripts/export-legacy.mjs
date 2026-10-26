#!/usr/bin/env node
// 一次性：把旧站（js/data.js + index.html 里的文案）导出成 SiteContent 初版快照 content/legacy-snapshot.json。
// 结构见 docs/cms-contract.md。图片仍是站内 /assets/... 路径，id 为 null；后端导入时上传 OSS 并替换。
//   node scripts/export-legacy.mjs
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import vm from "node:vm";

const root = new URL("..", import.meta.url).pathname;
const ctx = { window: {} };
vm.runInNewContext(readFileSync(root + "legacy/data.js", "utf8"), ctx);
const { info, teas, menu } = ctx.window.TBTS;
const mapping = JSON.parse(readFileSync(root + "docs/chowbus-mapping.json", "utf8")).items;

const sizeCache = {};
const dims = (path) => {
  if (!sizeCache[path]) {
    const out = execFileSync("sips", ["-g", "pixelWidth", "-g", "pixelHeight", root + "public/" + path], { encoding: "utf8" });
    sizeCache[path] = { w: +out.match(/pixelWidth: (\d+)/)[1], h: +out.match(/pixelHeight: (\d+)/)[1] };
  }
  return sizeCache[path];
};
const bi = (en, zh = "") => ({ en, zh });
const media = (path, altEn, altZh = "") => ({ id: null, url: "/" + path, ...dims(path), alt: bi(altEn, altZh) });

const TINTS = {
  "bubble-milk-tea": "#f3dcc3", "jasmine-green": "#eef0b0", "classic-oolong": "#f1c9a8", osmanthus: "#ffe3a3",
  "peach-oolong": "#ffd6c7", "earl-grey": "#f6cdb6", "taiwanese-oolong": "#e9d9c0", hawaii: "#ffd0b3",
};
const SHORT = { smoothie: bi("Cheese foam smoothies", "芝芝 / 满杯") };
const SIZE_NAMES = {
  medium: bi("Medium", "中杯"), "large(ice only)": bi("Large (iced only)", "大杯（仅冰）"),
  "large only(ice only)": bi("Large (iced only)", "大杯（仅冰）"),
  "medium (iced)": bi("Medium, iced", "中杯 冰"), "large (iced)": bi("Large, iced", "大杯 冰"), "medium (hot)": bi("Medium, hot", "中杯 热"),
};
const money = (c, plus) => `$${(c / 100).toFixed(2)}${plus ? "+" : ""}`;

let itemId = 0;
const menuOut = menu.map((c) => ({
  slug: c.id,
  name: bi(c.en, c.zh),
  shortName: SHORT[c.id] || null,
  items: c.items.map((it, i) => {
    const m = mapping.find((x) => x.site_category === c.id && x.site_index === i);
    if (!m) throw new Error(`no Chowbus mapping for ${c.id}/${it.en}`);
    return {
      id: ++itemId,
      name: bi(it.en, it.zh || ""),
      desc: bi(it.desc || "", ""),
      price: money(m.price_cents, m.price_has_options),
      priceCents: m.price_cents,
      hasOptions: m.price_has_options,
      sizes: m.sizes.map((s) => ({ name: SIZE_NAMES[s.name] || bi(s.name), priceCents: s.price_cents })),
      image: it.img ? media(it.img, it.en, it.zh || "") : null,
      tags: c.id === "seasonal" ? ["seasonal"] : [],
      soldOut: m.stock === 0,
      orderUrl: info.orderUrl,
    };
  }),
}));

const IMG = (p, en, zh) => media("assets/img/" + p, en, zh);
const blocks = {
  hero: {
    visible: true,
    eyebrow: bi("Premium Asian tea · East Boston waterfront", "精品亚洲原叶茶 · 东波士顿海滨"),
    title: bi("Boba, smoothies<br>&amp; matcha.<br>By the harbor.", "珍珠、冰沙、抹茶，<br>就在海边。"),
    lede: bi(
      "Premium Asian loose leaf tea brewed fresh every day, made into chewy boba milk teas, real fruit tea smoothies and organic Japanese matcha. Sip it on our deck facing the Boston skyline, or order for pickup or delivery.",
      "每天现泡精品亚洲原叶茶，做成 Q 弹珍珠奶茶、鲜果茶冰沙和日本有机抹茶。坐在正对波士顿天际线的海景露台喝，或者下单到店自取、外送到家。"),
    proof: [
      { value: "8", label: bi("tea bases", "款原叶茶底") },
      { value: "11–9", label: bi("open daily", "每日营业") },
      { value: "Harbor", label: bi("front deck", "海滨露台") },
    ],
    image: IMG("store/cup-in-hand.png", "A hand holding a Tea By The Sea fruit tea against the harbor and Boston skyline", "手拿一杯 Tea By The Sea 水果茶，背景是港湾和波士顿天际线"),
    caption: bi("Your tea comes with this view", "这一杯，自带海景"),
  },
  signature: {
    visible: true,
    kicker: bi("Built on premium Asian tea", "以精品亚洲原叶茶为底"),
    title: bi("Boba. Smoothies. Matcha.", "珍珠 · 冰沙 · 抹茶"),
    sub: bi("Three ways to drink our tea, each starting from leaves brewed fresh that morning, plus coffee made the tea-shop way.", "三种喝法，每一杯都从当天早上现泡的原叶茶开始；再加一杯茶饮店风格的咖啡。"),
    cards: [
      { theme: "boba", title: bi("Boba", "珍珠奶茶"), desc: bi("Chewy tapioca pearls in milk tea made with freshly brewed black or oolong tea.", "Q 弹珍珠，配现泡红茶或乌龙做的奶茶。"), more: bi("See boba drinks", "看珍珠奶茶"), category: "milk-tea", image: IMG("drinks/bubble-milk-tea.png", "Bubble milk tea with boba pearls", "珍珠奶茶") },
      { theme: "smoothie", title: bi("Smoothies", "鲜果冰沙"), desc: bi("Real fruit blended with ice: mango pomelo, strawberry, peach, watermelon and more.", "真实鲜果打成冰沙：杨枝甘露、草莓、蜜桃、西瓜等等。"), more: bi("See smoothies", "看冰沙"), category: "smoothie", image: IMG("drinks/mango-pomelo.png", "Mango pomelo smoothie with white boba and cheese foam", "杨枝甘露") },
      { theme: "matcha", title: bi("Matcha", "抹茶"), desc: bi("Organic Japanese matcha as a latte, a frozen blend, or layered with strawberry.", "日本有机抹茶，做成拿铁、冰沙，或者叠上草莓。"), more: bi("See matcha drinks", "看抹茶"), category: "matcha", image: IMG("drinks/strawberry-matcha-latte.png", "Strawberry matcha latte", "草莓抹茶拿铁") },
      { theme: "coffee", title: bi("Coffee", "咖啡"), desc: bi("Espresso with a tea-shop twist: topped with cheese foam, torched crème brûlée, or a classic latte.", "茶饮店做的意式咖啡：加芝士奶盖、炙烤布蕾，或者一杯经典拿铁。"), more: bi("See coffee", "看咖啡"), category: "coffee", image: IMG("drinks/latte.png", "Iced latte", "冰拿铁") },
    ],
  },
  tagline: {
    visible: true,
    kicker: bi("Why East Boston walks to the water", "为什么大家都往海边走"),
    text: bi("Fresh loose leaf tea tastes different when the harbor breeze rolls in and the Boston skyline sits right across your table.", "当海风吹过港湾，波士顿天际线坐到桌边，每日现泡的原叶茶也有了不一样的味道。"),
  },
  benefits: {
    visible: true,
    kicker: bi("What goes into every cup", "每一杯里的讲究"),
    title: bi("Real leaf, custom sweetness, harbor seat included.", "原叶现泡、甜度随心，外加一整片海景。"),
    cards: [
      { kicker: bi("Freshly brewed daily", "每日现泡原叶茶"), title: bi("Eight East Asian loose leaf bases, steeped in small batches", "八款东亚原叶茶底，每日小锅现泡"), body: bi("<strong>Real tea aroma without powder</strong> — Jasmine green, roasted oolong, osmanthus and Assam black tea are brewed fresh every morning so the finish stays clean and floral.", "<strong>拒绝茶粉与浓缩液</strong> — 茉莉绿茶、炭焙乌龙、桂花乌龙与阿萨姆红茶每天清晨现泡，入口花香清晰、回甘干净。") },
      { kicker: bi("Made to your taste", "甜度冰量可调"), title: bi("Dial in your exact sweetness, ice or warmth", "甜度、冰量与冷热都随你定"), body: bi("<strong>Full control on every drink</strong> — Pick light sugar to let the fruit and tea shine, go less ice, or ask for a warm cup on breezy harbor afternoons.", "<strong>每杯都能客制化</strong> — 想要三分糖突出茶香、少冰去冰，或是在海风天点一杯温热奶茶都可以。") },
      { kicker: bi("Year round patio", "全年海景露台"), title: bi("Front row to the downtown Boston skyline", "正对市中心天际线的海滨座位"), body: bi("<strong>Indoor lounge and outdoor deck</strong> — Step right out onto the East Boston harborwalk or unwind on the window sofas with friends all year.", "<strong>室内沙发与户外露台</strong> — 推门就是东波士顿海滨步道，四季都能看着对岸天际线喝茶聊天。") },
    ],
  },
  journey: {
    visible: true,
    kicker: bi("Your waterfront tea break", "你的海滨喝茶路线"),
    title: bi("Three simple steps to a better afternoon.", "三步，把普通下午变成海边时光。"),
    sub: bi("Order ahead for pickup or delivery: your cup is waiting at the harbor, or already on its way to you.", "提前下单，自取外送都行：走到海边直接拿，或者在家等它送上门。"),
    image: IMG("store/pickup-four-refined.jpg", "Four freshly made Tea By The Sea drinks ready for pickup with branded bags", "四杯打包好的饮品"),
    caption: bi("made fresh, packed for the harbor", "新鲜现做，拎去海边"),
    steps: [
      { title: bi("Choose your tea base", "选一款茶底"), body: bi("Start with one of eight loose leaf teas, then pick your fruit, milk or cheese foam and set your sweetness and ice.", "从八款现泡原叶茶底开始，搭配鲜果、鲜奶或芝士奶盖，再调好甜度与冰量。") },
      { title: bi("Order for pickup or delivery", "下单：自取或外送"), body: bi("Order on the web or in our app, choose pickup or delivery, and we will brew and shake it fresh.", "在网页或 App 下单，选择到店自取或外送，我们马上新鲜现做。") },
      { title: bi("Pick up by the harbor, or get it delivered", "海边自取，或外送到家"), body: bi("Picking up? Use the waterfront entrance at 99 Sumner Street and grab a patio table with the skyline. Delivery? Sit tight, your tea comes to you.", "自取请走 99 Sumner Street 海滨入口，顺便在露台看看对岸的波士顿；选外送，就在家等它送到门口。") },
    ],
  },
  teas: {
    visible: true,
    kicker: bi("Eight loose leaf foundations", "八款现泡原叶茶底"),
    title: bi("Start with the tea", "一切从茶底开始"),
    sub: bi("Eight loose leaf teas from across East Asia, selected through repeated tastings and brewed fresh every day. Every drink begins with one of them.", "八款原叶茶，来自东亚各产区，经过多轮试饮挑选，每天现泡。菜单上每一杯都从其中一款开始。"),
  },
  favs: {
    visible: true,
    kicker: bi("Customer favorites", "人气必点"),
    title: bi("What people order", "大家都在点"),
    note: bi("Sugar and ice are adjustable on every drink, and most come warm or hot too.", "每杯都能调甜度和冰量，大部分饮品也可以做温的或热的。"),
    categories: ["milk-tea", "smoothie", "fruit-tea", "coconut", "matcha", "taro", "yakult"].map((category) => ({ category })),
  },
  deck: {
    visible: true,
    kicker: bi("The harbor view", "港湾海景"),
    title: bi("A front row seat to the skyline", "坐在天际线的第一排"),
    paragraphs: [
      { body: bi("Our lounge and patio sit right on the harbor, facing downtown Boston. Come for a drink, stay for the sunset. The waterfront patio is open all year, and of course there are seasonal drinks.", "店里的休息区和户外露台就在港湾边，正对波士顿市中心。来喝一杯，顺便看个日落。海边露台全年开放，当然还有季节限定饮品。") },
      { body: bi("Tea By The Sea was founded by people from families rooted in tea culture. Whether you have had a hundred bubble teas or this is your first, we hope there is something here for you.", "Tea By The Sea 的创始人来自喝茶长大的家庭。无论你是奶茶老手（希望这里能有一点家的感觉）还是第一次尝试，都希望你能在这里找到喜欢的那一杯。") },
    ],
    photos: [
      { image: IMG("store/drinks-skyline.jpg", "Five fruit teas lined up on the railing with the Boston skyline behind", "栏杆上的五杯水果茶，背后是波士顿天际线"), caption: bi("fruit teas on the railing", "栏杆上的水果茶") },
      { image: IMG("store/sunset-skyline.jpg", "Sunset over the Boston skyline seen from the harbor", "港湾看波士顿日落"), caption: bi("sunsets like this", "这样的日落") },
      { image: IMG("store/cherry-blossom.jpg", "Cherry blossoms along the waterfront park in spring", "春天海滨公园的樱花"), caption: bi("spring on the harborwalk", "春天的海滨步道") },
      { image: IMG("store/patio-drinks-refined.jpg", "Three colorful Tea By The Sea drinks on the waterfront patio", "海边露台上的三杯饮品"), caption: bi("three cups, one harbor table", "三杯茶，一张海边桌") },
    ],
  },
  press: {
    visible: true,
    kicker: bi("Press & community", "媒体推荐与口碑"),
    title: bi("Recommended by The New York Times", "《纽约时报》推荐"),
    body: bi("Featured in “36 Hours in Boston” as a stop on the East Boston waterfront.", "入选《纽约时报》“波士顿 36 小时”东波士顿海滨推荐。"),
    image: IMG("store/nyt-feature.png", "Clipping of The New York Times 36 Hours in Boston feature recommending Tea By The Sea", "《纽约时报》波士顿 36 小时报道截图"),
    reviewsLabel: bi("Like us? Leave a review on", "喜欢我们？欢迎在以下平台留下评价："),
  },
  space: {
    visible: true,
    kicker: bi("Events & catering", "场地预约与外送"),
    title: bi("Host your thing here", "来这里办活动"),
    body: bi("Birthdays, indoor competitions, meetups, alumni reunions, small workshops or just a big group of friends. Our space comes with harbor views and a drink for everyone.", "生日会、室内比赛、社团聚会、校友重聚、小型工作坊，或者只是一大群朋友聚一聚。空间自带海景，饮品管够。"),
    tags: [
      bi("🎂 Birthday bashes", "🎂 生日派对"), bi("🏆 Competitions & game nights", "🏆 比赛与桌游"), bi("🎓 Alumni reunions", "🎓 校友重聚"),
      bi("🎨 Small workshops", "🎨 小型工作坊"), bi("🍵 Social gatherings & catering", "🍵 聚会与饮品外送"),
    ].map((text) => ({ text })),
    formIntro: bi("We cater, too. Tell us your date and group size below, or email us directly.", "也承接饮品外送订餐（Catering）。在下方填写活动日期与人数提交咨询，或者直接发邮件给我们。"),
    image: IMG("store/interior-hall.jpg", "The open interior of Tea By The Sea with the order counter and harbor windows", "店内大厅、点单台和海景窗"),
    accentImage: IMG("store/sign-wall-refined.jpg", "The blue Tea By The Sea sign", "蓝色招牌"),
    accentCaption: bi("Look for the blue sign", "看到蓝色招牌就到了"),
  },
  visit: {
    visible: true,
    kicker: bi("East Boston waterfront", "东波士顿海滨"),
    title: bi("Come find us", "来店里坐坐"),
    image: IMG("store/counter-plants-refined.jpg", "Tea By The Sea order counter framed by indoor plants", "绿植环绕的点单台"),
    caption: bi("walk in, order, stay awhile", "进来点一杯，坐一会儿"),
    mapNote: bi("use the waterfront entrance", "走海边那侧的入口"),
    appsLabel: bi("Order ahead in our app", "下载 App 提前点单"),
  },
  faq: {
    visible: true,
    kicker: bi("Before you visit", "到店之前"),
    title: bi("Good to know.", "你可能想知道。"),
    sub: bi("The useful details on hours, entrance, drink customization and private events.", "关于营业时间、海滨入口、甜度冰量与包场外送的常见问题。"),
    items: [
      [bi("When are you open?", "营业时间是什么？"), bi("We are open every day from 11am to 9pm, all year round.", "全年每天 11:00 至 21:00 营业。")],
      [bi("Which entrance should I use?", "应该从哪个入口进店？"), bi("Use the waterfront entrance at 99 Sumner Street facing the harborwalk. The map above points right to the building.", "请走 99 Sumner Street 朝向海滨步道一侧的入口，上方地图可直接导航。")],
      [bi("Can I change the sweetness and ice?", "可以调整甜度和冰量吗？"), bi("Yes. Sweetness and ice levels are adjustable on every drink when you order online or at the counter.", "可以，在线点单或到店点单时，每杯饮品都能自由调整甜度和冰量。")],
      [bi("Do you make warm drinks?", "有温饮或热饮吗？"), bi("Most milk teas, pure teas, taro drinks and coffees can be made warm or hot. Select your temperature when ordering.", "大部分奶茶、纯茶、芋泥和咖啡系列都可以做温饮或热饮，点单时选择温度即可。")],
      [bi("Can I host an event here?", "可以在店里办活动吗？"), bi("Yes. We welcome birthdays, meetups, workshops and group gatherings with harbor views. Use the inquiry form above to share your date and headcount.", "可以。生日、社团聚会、工作坊和团体包场都欢迎，可通过上方表单或邮件告知日期和人数。")],
      [bi("Do you offer catering?", "提供饮品外送订餐（Catering）吗？"), bi("Yes. Email us with your event details, delivery time and the drinks you have in mind.", "提供。请发邮件告诉我们活动时间、人数和想预订的饮品。")],
    ].map(([q, a]) => ({ q, a })),
  },
  finalCta: {
    visible: true,
    kicker: bi("Tea is brewing", "茶已经在泡了"),
    title: bi("Your next harbor break starts here.", "下一次海边休息，从这一杯开始。"),
  },
  menuPage: {
    visible: true,
    kicker: bi("Made fresh in East Boston", "东波士顿每日新鲜制作"),
    title: bi("The menu", "菜单"),
    intro: bi("Everything is made to order with fresh brewed tea and real fruit. Sugar and ice are up to you. Prices match our online order page.", "每一杯都是现点现做，现泡茶底、现切水果，甜度和冰量随你调。价格与在线点单页同步。"),
    footnote: bi("Hot or warm options are available for most drinks. Ask us about allergens at the counter.", "大部分饮品可做热饮或温饮。如有过敏原相关问题，欢迎在柜台询问。"),
  },
};

const snapshot = {
  schema: 1,
  version: 0,
  publishedAt: "2026-10-26T00:00:00Z",
  store: {
    name: info.name,
    phone: info.phone,
    phoneIntl: info.phoneIntl,
    email: info.email,
    address: { en: info.address_en, zh: info.address_zh },
    hours: info.hours,
    timezone: "America/New_York",
    links: {
      order: info.orderUrl,
      map: info.mapUrl,
      mapEmbed: "https://maps.google.com/maps?q=Tea%20By%20The%20Sea%2C%2099%20Sumner%20St%2C%20East%20Boston%2C%20MA%2002128&z=15&output=embed",
      instagram: info.instagram,
      xiaohongshu: info.xiaohongshu,
      yelp: "https://www.yelp.com/biz/teabythesea-boston",
      tripadvisor: "https://www.tripadvisor.com/Restaurant_Review-g60745-d28054986-Reviews-Tea_By_The_Sea-Boston_Massachusetts.html",
      google: info.mapUrl,
      appStore: "https://apps.apple.com/us/app/tea-by-the-sea/id6808102062",
      googlePlay: "https://play.google.com/store/apps/details?id=com.chowbus.branded.teabythesea",
      appStoreId: "6808102062",
    },
  },
  seo: {
    home: {
      title: bi("Tea By The Sea · Boba, Smoothies & Matcha in East Boston", "Tea By The Sea · 东波士顿海边的珍珠奶茶、冰沙与抹茶"),
      description: bi("Boba milk tea, real fruit tea smoothies and organic Japanese matcha, made with premium Asian loose leaf tea brewed fresh daily. On the East Boston waterfront at 99 Sumner Street, for pickup or delivery.", "每日现泡精品亚洲原叶茶，做成珍珠奶茶、鲜果茶冰沙和日本有机抹茶。位于东波士顿海滨 99 Sumner Street，可自取或外送。"),
    },
    menu: {
      title: bi("Menu · Tea By The Sea", "菜单 · Tea By The Sea"),
      description: bi("The full Tea By The Sea menu with prices: bubble milk tea, cheese foam smoothies, fresh fruit tea, matcha, coffee, desserts and pastries.", "Tea By The Sea 完整菜单和价格：珍珠奶茶、芝士冰沙、鲜果茶、抹茶、咖啡、甜品和点心。"),
    },
    ogImage: IMG("store/cup-in-hand.png", "Tea By The Sea fruit tea with the Boston skyline", "Tea By The Sea 水果茶与波士顿天际线"),
  },
  blocks,
  teas: teas.map((t) => ({
    id: t.id,
    name: bi(t.en, t.zh),
    desc: bi(t.desc_en, t.desc_zh),
    notes: bi(t.notes_en, t.notes_zh),
    roast: t.roast,
    ferment: t.ferment,
    tint: TINTS[t.id],
    image: media(t.img, `${t.en} in a Tea By The Sea cup`, t.zh),
  })),
  menu: menuOut,
  toppings: [
    ["oat milk", "燕麦奶", 75], ["aloe", "芦荟", 95], ["chewy boba", "珍珠", 95], ["grapefruit pulp", "西柚果粒", 95],
    ["lychee jelly", "荔枝果冻", 95], ["mango popping boba", "芒果爆爆珠", 95], ["oreo", "奥利奥", 95], ["pudding", "布丁", 95],
    ["red bean", "红豆", 95], ["taro paste", "芋泥", 95], ["white boba", "白珍珠", 95], ["coconut milk", "椰奶", 100],
    ["cheese foam", "芝士奶盖", 150], ["crème brûlée", "布蕾", 150],
  ].map(([en, zh, priceCents]) => ({ name: bi(en.replace(/^./, (c) => c.toUpperCase()), zh), priceCents })),
};

mkdirSync(root + "content", { recursive: true });
writeFileSync(root + "content/legacy-snapshot.json", JSON.stringify(snapshot, null, 2) + "\n");
console.log(`content/legacy-snapshot.json: ${snapshot.teas.length} teas, ${menuOut.length} categories, ${itemId} items, ${Object.keys(blocks).length} blocks`);
