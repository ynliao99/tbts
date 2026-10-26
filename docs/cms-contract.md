# Tea By The Sea CMS 接口与内容契约

版本 1（2026-10-26）。官网（`ynliao99/tbts`）、Vectra 后端（`portal_api`）和 Vectra 前端（`uswoo_portal`）三方以本文为准。要改动，先改这份文档，再改代码。背景和取舍见 [`plan-vue-cms.md`](plan-vue-cms.md)。

## 1. 通用约定

- **双语文本**：`Bi = { "en": string, "zh": string }`。`zh` 可以为空字符串，官网显示时回退到 `en`。
- **富文本**：`BiRich` 结构与 `Bi` 相同，但值里只允许 `<br>`、`<strong>`、`<em>` 三种标签。后端保存前做白名单清洗，官网用 `v-html` 输出。
- **图片**：`Media = { "id": number|null, "url": string, "w": number, "h": number, "alt": Bi }`。
  - 快照里的 `url` 是绝对地址 `https://public-pic.uswoo.cn/tbts/media/...`。
  - 只有迁移前的本地快照（`src/content/fallback.json` 的初版）里允许出现 `/assets/...` 这样的站内路径，此时 `id` 为 `null`。
- **价格**：存美分（`priceCents`）；显示用字符串 `price`（如 `"$6.50+"`），由后端在导出快照时生成。规则：`"$" + (cents/100).toFixed(2)`，`hasOptions` 为真时末尾加 `+`。
- **时间**：ISO 8601 UTC。营业时间是一天中的分钟数，按 `America/New_York` 时区，周日在前。
- **接口响应**：沿用 Vectra 的约定。
  - 成功：`{ "status": "success", "data": … }`
  - 失败：`{ "status": "error", "message": "…", "error_key": "tbts.xxx" }`，并带上相应的 HTTP 状态码。
  - 分页：`data = { "list": [...], "total": n, "page": 1, "pageSize": 20 }`，`pageSize` 不超过 100。

## 2. 内容快照 `SiteContent`

这是发布的唯一产物。后端发布时导出这份 JSON，写到官网服务器的 `/content/site.json`；官网打包时从公开 API 拉取，运行时读取，结构完全相同。

```ts
interface SiteContent {
  schema: 1;
  version: number;            // tbts_release.id；本地初版快照为 0
  publishedAt: string;
  store: {
    name: string;             // "Tea By The Sea"
    phone: string;            // "508-685-7127"
    phoneIntl: string;        // "+15086857127"
    email: string;
    address: { en: string[]; zh: string[] };   // 逐行；第 0 行是「Waterfront Entrance at / 海滨入口」
    hours: [number, number][];                 // 7 项，周日在前，[开门分钟, 关门分钟]
    timezone: "America/New_York";
    links: {
      order: string; map: string; mapEmbed: string;
      instagram: string; xiaohongshu: string;
      yelp: string; tripadvisor: string; google: string;
      appStore: string; googlePlay: string; appStoreId: string;
    };
  };
  seo: {
    home: { title: Bi; description: Bi };
    menu: { title: Bi; description: Bi };
    ogImage: Media;
  };
  blocks: Blocks;             // 见 §3
  teas: Tea[];
  menu: MenuCategory[];
  toppings: { name: Bi; priceCents: number }[];   // Chowbus 加料价目，可为空数组
}

interface Tea {
  id: string;                 // slug，如 "jasmine-green"
  name: Bi;                   // en 用作标题，zh 是中文名
  desc: Bi;
  notes: Bi;
  roast: number;              // 0–5
  ferment: number;            // 0–5
  tint: string;               // 背景色，如 "#eef0b0"
  image: Media;
}

interface MenuCategory {
  slug: string;               // 用作锚点 #cat-{slug}，已有的不能改
  name: Bi;
  shortName: Bi | null;       // 首页「人气必点」标签里用的短名
  items: MenuItem[];
}

interface MenuItem {
  id: number;                 // tbts_menu_item.id；本地初版快照里是序号
  name: Bi;
  desc: Bi;
  price: string;              // "$6.50+"
  priceCents: number;
  hasOptions: boolean;
  sizes: { name: Bi; priceCents: number }[];   // 可为空
  image: Media | null;
  tags: ("new" | "hot" | "seasonal")[];
  soldOut: boolean;
}
```

## 3. 首页区块 `Blocks`

每个区块的字段固定。按钮文案、导航、页脚标题等界面固定文字不进 CMS，写在官网代码里。

字段类型标记（后端 `domain/tbts/BlockSchemas.php` 和前端表单都按这套生成）：

| 类型 | JSON 值 | 编辑控件 |
| --- | --- | --- |
| `text` | `Bi` | 中英两个单行输入框 |
| `textarea` | `Bi` | 中英两个多行输入框 |
| `rich` | `BiRich` | 中英两个多行输入框，提示可用 `<br>` `<strong>` `<em>` |
| `image` | `Media` | 媒体库选图，含中英 alt |
| `string` | `string` | 单行输入框 |
| `url` | `string` | 单行输入框，校验 `https://` 或站内以 `/` 开头的路径 |
| `select` | `string` | 下拉框，选项见 `options` |
| `categoryRef` | `string` | 下拉框，选菜单分类 slug |
| `list` | `array` | 可增删、可拖拽排序的子表单，有 `min` / `max` 限制 |

每个区块值都带 `visible: boolean`（是否在首页显示），下表省略。`[n]` 表示固定 n 项，`[a–b]` 表示 a 到 b 项。

| block_key | 字段 |
| --- | --- |
| `hero` | `eyebrow` text；`title` rich；`lede` textarea；`proof` list[3] { `value` string, `label` text }；`image` image；`caption` text |
| `signature` | `kicker` text；`title` text；`sub` textarea；`cards` list[3] { `theme` select(boba/smoothie/matcha), `title` text, `desc` textarea, `more` text, `category` categoryRef, `image` image } |
| `tagline` | `kicker` text；`text` textarea |
| `benefits` | `kicker` text；`title` text；`cards` list[3] { `kicker` text, `title` text, `body` rich } |
| `journey` | `kicker` text；`title` text；`sub` textarea；`image` image；`caption` text；`steps` list[3] { `title` text, `body` textarea } |
| `teas` | `kicker` text；`title` text；`sub` textarea |
| `favs` | `kicker` text；`title` text；`note` textarea；`categories` list[1–8] { `category` categoryRef } |
| `deck` | `kicker` text；`title` text；`paragraphs` list[1–3] { `body` textarea }；`photos` list[4] { `image` image, `caption` text } |
| `press` | `kicker` text；`title` text；`body` textarea；`image` image；`reviewsLabel` text |
| `space` | `kicker` text；`title` text；`body` textarea；`tags` list[0–8] { `text` text }；`formIntro` textarea；`image` image；`accentImage` image；`accentCaption` text |
| `visit` | `kicker` text；`title` text；`image` image；`caption` text；`mapNote` text；`appsLabel` text |
| `faq` | `kicker` text；`title` text；`sub` textarea；`items` list[1–12] { `q` text, `a` textarea } |
| `finalCta` | `kicker` text；`title` text |
| `menuPage` | `kicker` text；`title` text；`intro` textarea；`footnote` textarea |

说明：

- 「茶底」区块的 8 款茶来自 `teas`，「人气必点」的商品来自 `menu` 中有图片的前 8 个商品。
- 「到店」区块的地址、电话、营业时间来自 `store`。
- 「好处」区块三张卡片里的动画（茶香标签、甜度拨盘、渡轮路线）是固定的装饰，不进 CMS。

## 4. 管理接口（需登录，`tbts_admin` 或 `all`）

前缀 `/backend_v2/tbts`。除上传外，请求体都是 JSON。凡是单条记录的写操作，都要带上读取时拿到的 `updatedAt` 做乐观锁；不一致时返回 409 `tbts.edit_conflict`。

| 方法 | 路径 | 请求 | 返回 `data` |
| --- | --- | --- | --- |
| GET | `/settings` | | `{ store, seo, updatedAt }`（结构同快照） |
| PUT | `/settings` | `{ store, seo, updatedAt }` | 同 GET |
| GET | `/blocks` | | `{ schemas: { [key]: FieldDef[] }, blocks: { [key]: { content, visible, updatedAt, updatedBy } } }` |
| PUT | `/blocks/{key}` | `{ content, visible, updatedAt }` | 单个区块 |
| GET | `/teas` | | `Tea & { dbId, enabled, sort, updatedAt }`[] |
| POST | `/teas` | Tea 字段（`image` 只传 `{ id }`） | 新记录 |
| PUT | `/teas/{dbId}` | 同上加 `updatedAt` | 记录 |
| DELETE | `/teas/{dbId}` | | `null` |
| PUT | `/teas/sort` | `{ ids: number[] }` | `null` |
| GET | `/menu/categories` | | `{ id, slug, name, shortName, enabled, sort, chowbusCategoryId, itemCount, updatedAt }`[] |
| POST / PUT / DELETE | `/menu/categories[/{id}]` | 分类字段；删除时分类必须为空 | |
| PUT | `/menu/categories/sort` | `{ ids }` | |
| GET | `/menu/items?categoryId=&q=&enabled=&chowbus=linked\|unlinked&page=&pageSize=` | | 分页；行 = `MenuItem & { categoryId, enabled, featured, sort, priceSource: "chowbus"\|"manual", chowbusItemId, chowbusPrototypeId, chowbusSeenAt, updatedAt }` |
| POST / PUT / DELETE | `/menu/items[/{id}]` | 商品字段；`priceSource = "chowbus"` 时价格字段只读，提交了会被忽略 | |
| PUT | `/menu/items/sort` | `{ categoryId, ids }` | |
| PUT | `/menu/items/batch` | `{ ids, action: "enable"\|"disable"\|"move", categoryId? }` | `{ affected }` |
| PUT | `/menu/items/{id}/chowbus-link` | `{ chowbusItemId: string\|null }` | 记录 |
| GET | `/media?q=&unused=1&page=&pageSize=` | | 分页；行 = `Media & { mime, bytes, source: "project"\|"upload"\|"chowbus", createdAt, uploadedBy, refCount }` |
| POST | `/media` | `multipart/form-data`：`file`，可选 `alt_en`、`alt_zh` | `Media & {…}`；内容重复时返回已有那条 |
| PUT | `/media/{id}` | `{ alt }` | 记录 |
| DELETE | `/media/{id}` | | 仍被引用时返回 409 `tbts.media_in_use`，`data.refs` 列出引用处 |
| GET | `/media/{id}/refs` | | `{ kind: "block"\|"tea"\|"item"\|"seo", key, label }`[] |
| GET | `/draft/diff` | | `{ liveVersion, changes: { path, label, before, after }[] }` |
| POST | `/preview-token` | | `{ token, expiresAt, url }`，`url` = `https://teabytheseaboston.com/?preview={token}` |
| GET | `/releases?page=` | | 分页；行 = `{ id, note, createdBy, createdAt, deployStatus: "pending"\|"deploying"\|"live"\|"failed", deployedAt, rollbackOf, source: "manual"\|"chowbus"\|"rollback" }` |
| POST | `/releases` | `{ note }` | 新 release（状态为 pending） |
| GET | `/releases/{id}` | | 记录，加上 `deployLog` |
| POST | `/releases/{id}/rollback` | `{ note? }` | 新 release |
| POST | `/releases/{id}/redeploy` | | 记录 |
| GET | `/inquiries?status=&page=` | | 分页；行 = `{ id, name, email, phone, eventDate, guests, details, lang, status, handledBy, handledAt, note, createdAt }` |
| PUT | `/inquiries/{id}` | `{ status, note }` | 记录；同时更新企业微信卡片 |
| GET | `/chowbus/status` | | `{ lastRun: SyncRun\|null, unmatched: ChowbusItem[], missing: MenuItemRef[], recent: SyncRun[] }` |
| POST | `/chowbus/sync` | | `SyncRun`（同步执行，15 秒超时） |

- `FieldDef = { name, type, label: Bi, required?, maxLength?, options?, min?, max?, fields?: FieldDef[] }`。
- `SyncRun = { id, startedAt, finishedAt, status: "ok"\|"failed"\|"paused", itemsSeen, priceChanges: { itemId, name, before, after }[], error, releaseId }`。

错误 key 前缀统一为 `tbts.`，至少包括：

- `tbts.forbidden`、`tbts.not_found`、`tbts.edit_conflict`、`tbts.validation_failed`（`data.fields` 写明哪个字段出错）
- `tbts.media_too_large`、`tbts.media_type_unsupported`、`tbts.media_in_use`、`tbts.upload_failed`
- `tbts.category_not_empty`、`tbts.price_locked_by_chowbus`
- `tbts.release_in_progress`、`tbts.preview_token_invalid`
- `tbts.chowbus_fetch_failed`、`tbts.inquiry_rate_limited`

## 5. 公开接口（免登录）

前缀 `/backend_v2/mc/tbts`。官网服务器的 nginx 把 `https://teabytheseaboston.com/api/` 反代到这里，所以浏览器只访问同域的 `/api/…`。

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/content` | 当前线上版本的 `SiteContent`。打包和监控用；官网运行时读的是 `/content/site.json` |
| GET | `/content/preview?token=` | 草稿生成的 `SiteContent`，`version` 为 `-1`；令牌无效时返回 403 `tbts.preview_token_invalid` |
| POST | `/inquiries` | 请求：`{ name, email, phone?, eventDate?, guests?, details, lang: "en"\|"zh", website: "" }`。`website` 是 honeypot，必须为空。返回 `{ id }`；被限流时返回 429 `tbts.inquiry_rate_limited` |

## 6. 文件与目录

| 位置 | 内容 |
| --- | --- |
| 官网服务器 `/data/sites/teabytheseaboston.com-content/site.json` | 当前线上快照，由发布任务原子写入 |
| 官网服务器 `/data/sites/teabytheseaboston.com-content/v/{id}.json` | 历史快照 |
| `ynliao99/tbts` 的 `content/legacy-snapshot.json` | 从旧站导出的初版快照，`version` 为 0，图片是 `/assets/...` 站内路径。后端导入脚本以它为输入 |
| `ynliao99/tbts` 的 `docs/chowbus-mapping.json` | Chowbus 商品对应关系，导入时使用 |
| OSS `ossedu-pic-public` 的 `tbts/media/{yyyy}/{sha1}.{ext}` | 所有图片，逐个对象设为 public-read |
