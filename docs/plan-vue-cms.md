# Tea By The Sea 官网：Vue 重写 + Vectra CMS 计划

日期：2026-10-26
涉及仓库：

- `ynliao99/tbts`：官网，本仓库
- `uswoo_portal`：Vectra 前端
- `ynliao99/portal_api`：Vectra 后端，部署在 `panel.uswoo.cn:/www/wwwroot/uswoo.lyndon.work`

## 0. 目标与总体思路

1. 官网用 Vue 3 重写。线上观感、URL、SEO 和中英切换都保持现状。
2. 在 Vectra 里加一个「Tea By The Sea 官网」管理模块，管门店信息、首页全部区块的文案和图片、茶底、菜单（分类、商品、价格、图片）、媒体库、咨询线索，并负责发布和回滚。只有新角色 `tbts_admin` 和 `all` 可见，`superAdmin` 不可见。
3. 图片上传到阿里云 OSS 的 `ossedu-pic-public` bucket，对外走 CDN 域名 `public-pic.uswoo.cn`；复用 Vectra 后端已有的 `OssStorageGateway`，在 `oss_config` 补一行。
4. Vectra 后端开放给官网用的公开 API：已发布内容、预览内容、活动咨询表单。咨询提交后，用企业微信卡片推给所有 `tbts_admin`，并在企业微信里处理。
5. 菜单价格与 Chowbus 点单页自动对齐（§3.6）。
6. 官网代码在本地打包，经 Vectra 后端服务器（`panel.uswoo.cn`）跳转，上传到 wordpress-server（`172.27.235.198`）。这条路径已验证可用：现在的 `scripts/deploy.sh` 就是这么走的。

核心设计：**代码和内容分开发布。**

```
           ┌──────────── Vectra 前端 (vectra.uswoo.cn) ────────────┐
 tbts_admin│  编辑草稿 → 预览 → 发布 / 回滚        上传图片          │
           └───────────────┬───────────────────────────┬───────────┘
                           │ /backend_v2/tbts/*         │ multipart
           ┌───────────────▼───────────────────────────▼───────────┐
           │ Vectra 后端 (panel.uswoo.cn, PHP 8.4, MySQL)            │
           │  tbts_* 草稿表 ──发布──▶ tbts_release（不可变快照 JSON） │
           │  OssStorageGateway ──▶ ossedu-pic-public ─CDN─ public-pic│
           │  按需任务 tbts_publish（root）── ssh ──┐                 │
           │  公开 API /backend_v2/mc/tbts/*        │                 │
           └────────────────────────────────────────┼─────────────────┘
                                                    ▼
           ┌──── wordpress-server 172.27.235.198 / nginx ────────────┐
           │ /data/sites/teabytheseaboston.com      ← 代码（本地打包） │
           │ /data/sites/teabytheseaboston.com-content/site.json     │
           │                                       ← 内容（发布任务）  │
           └──────────────────────────────────────────────────────────┘
```

- **代码（Vue 打包产物）**：本地 `pnpm build`，`scripts/deploy.sh` 经跳板机上传，旧版本保留为 `.prev`，和现在一样。
- **内容（JSON 快照）**：在 Vectra 点「发布」后，后端任务把快照写到官网服务器的独立目录。改内容不用重新打包，也不会被代码发布覆盖。
- **运行时**：官网读同域的 `/content/site.json`，不跨域，也不依赖 Vectra 在线。Vectra 宕机时官网照常运行。
- **SEO**：打包时 vite-ssg 从公开 API 拉取最新已发布内容，预渲染成静态 HTML。浏览器加载后如果 `/content/site.json` 的版本更新，就用新内容替换。

## 1. 现状盘点

| 项 | 现状 |
| --- | --- |
| 页面 | `index.html`（13 个 section，约 740 行）、`menu.html`、`privacy.html`、`terms.html`、`404.html` |
| 数据 | `js/data.js`：`info`（门店信息、营业时间、链接）、`teas`（8 个茶底）、`menu`（15 个分类及商品，含 en/zh/desc/price/img） |
| 文案 | 首页绝大部分文案写死在 HTML 里，用成对的 `<span lang="en">` / `<span lang="zh">` 实现双语 |
| 交互 | `js/main.js` 约 800 行：语言切换（`?lang=` 和 localStorage）、营业状态、茶底切换、菜单渲染、搜索和分类导航、滚动隐藏页头、移动菜单、吉祥物气泡、活动咨询邮件草稿、App 链接、入场动画 |
| 样式 | `css/style.css` 约 3100 行，顶部定义 token |
| 图片 | `assets/img/`：drinks、store、tea、brand、badges，约 90 张 |
| 部署 | 本地执行 `scripts/deploy.sh`，`git archive` 后经 panel 跳到 .198，旧版本保留为 `.prev`；GitHub Pages 用作预览 |
| HTTPS | Let's Encrypt，自动续期；nginx 配置在 `scripts/nginx/` |

## 2. 官网：Vue 重写（`ynliao99/tbts`）

### 2.1 技术选型

- 技术栈：**Vue 3 + Vite + vue-router + vite-ssg**，包管理器用 pnpm，与 Vectra 一致；语言用 TypeScript。
  - 选 vite-ssg，是为了让每个路由都输出一份完整的静态 HTML，搜索引擎和首屏都不受影响，服务器上也不需要 Node。
- 不引入 UI 框架。现有 `style.css` 先整体保留为全局样式，再逐步拆进组件的 `<style scoped>`。这一阶段要求视觉零变化。
- 双语保持现有做法：每段文案同时输出中英两个 span，CSS 按 `html[data-lang]` 显示其中一种。
  - 好处是语言切换不闪屏，中英文都会被搜索引擎收录。
  - 封装成组件 `<Bi :t="{en, zh}" />`，HTML 换行用 `<Bi rich>`。
- 路由：
  - `/` 首页
  - `/menu` 菜单
  - `/privacy`、`/terms` 法律页
  - 404 页
- 旧链接兼容（已定）：`menu.html`、`privacy.html` 和 `terms.html` 由 nginx 301 到新路径，保留 query 和 `#cat-*` 锚点。
  - 锚点不会发给服务器，浏览器在 301 后会自动带上，所以 `menu.html#cat-matcha` 跳转后仍是 `/menu#cat-matcha`。
  - sitemap 和 canonical 都改用新路径。

### 2.2 目录

```
src/
  main.ts                 ViteSSG 入口
  App.vue                 页头 / 页脚 / 语言状态
  router.ts
  content/
    types.ts              SiteContent 类型（与后端快照 schema 一一对应）
    fallback.json         打包时从公开 API 拉下的已发布快照
    useContent.ts         先用 fallback 渲染，挂载后拉 /content/site.json，version 更新则替换
    useLang.ts            语言切换（?lang= / localStorage / 链接同步）
    useOpenStatus.ts      营业状态（波士顿时区）
  components/
    Bi.vue  SiteHeader.vue  SiteFooter.vue  MobileNav.vue  OssImage.vue
    home/  Hero.vue Signature.vue Tagline.vue Benefits.vue Journey.vue Teas.vue
           Favs.vue Deck.vue Press.vue Space.vue Visit.vue Faq.vue FinalCta.vue
    menu/  MenuBar.vue MenuSection.vue MenuItem.vue MenuSearch.vue
  pages/   Home.vue Menu.vue Privacy.vue Terms.vue NotFound.vue
  styles/  tokens.css base.css（由 style.css 拆出）
public/
  assets/svg/…            手绘天际线等不进 CMS 的静态资源
scripts/
  fetch-content.mjs       打包前拉取已发布快照，写入 src/content/fallback.json
  export-legacy.mjs       一次性：把 data.js 和 HTML 文案导出成首个快照
  deploy.sh               打包产物经跳板机上传
```

### 2.3 内容快照的结构（`SiteContent`）

同一个 JSON 同时用于后端导出、官网渲染和类型定义：

```jsonc
{
  "version": 12,                       // tbts_release.id
  "publishedAt": "2026-11-02T15:04:05Z",
  "store":  { "name", "phone", "phoneIntl", "email", "address": {"en":[],"zh":[]},
              "hours": [[660,1260], …×7], "timezone": "America/New_York",
              "links": { "order", "instagram", "xiaohongshu", "map", "appStore", "googlePlay" } },
  "seo":    { "title": {"en","zh"}, "description": {"en","zh"}, "ogImage": Media },
  "blocks": { "hero": {…}, "signature": {…}, "tagline": {…}, "benefits": {…}, "journey": {…},
              "teasIntro": {…}, "favs": {…}, "deck": {…}, "press": {…}, "space": {…},
              "visit": {…}, "faq": {…}, "finalCta": {…} },
  "teas":   [ { "id", "name": {en,zh}, "desc": {en,zh}, "notes": {en,zh},
                "roast": 0-5, "ferment": 0-5, "image": Media } ],
  "menu":   [ { "slug", "name": {en,zh}, "items": [ { "id", "name": {en,zh}, "desc": {en,zh},
                "price": "$5.50+", "image": Media, "tags": ["new","hot","seasonal"],
                "featured": true } ] } ]
}
// Media = { "url", "w", "h", "alt": {en,zh} }，url 是 OSS 公开地址
```

- 每个 block 有自己固定的字段 schema，比如 hero 有 eyebrow、title、lede、按钮文案和图片。
  - 后端在 `domain/tbts/BlockSchemas.php` 校验，前端按同一份 schema 生成表单。
  - 这样不会变成可以随意拼页面的页面搭建器，设计不会被改乱。
- `OssImage.vue` 统一输出 `srcset`，用图片处理参数 `?x-oss-process=image/resize,w_{n}/format,webp` 生成多个尺寸（经 CDN 回源 OSS 处理，见 §4），加 `width/height` 防布局抖动，首屏图不懒加载。

### 2.4 迁移步骤

1. 搭 Vite + vite-ssg 骨架，原样引入 `style.css`，先只做页头、页脚和语言切换。
2. 逐个 section 迁成组件，内容先读本地 `fallback.json`，由 `scripts/export-legacy.mjs` 从 `data.js` 和现有 HTML 生成。
3. 把 `main.js` 的交互逐项改写成 composable 或组件逻辑：
   - 滚动隐藏页头，以及菜单页只在工具栏上方显示页头
   - 移动端全屏菜单
   - 茶底标签横向滚动
   - 菜单分类 chip 和搜索
   - 入场动画
   - 吉祥物
   - 咨询邮件草稿
   - App 链接按设备跳转

   上一轮修过的 iOS 问题要逐条保留：状态栏白条、`visibility` 遮挡、`minmax(0,1fr)`、只做横向 scroll、不调用 `scrollIntoView`。
4. 和线上旧版逐页对比：
   - 宽度 1440、1024、768、390、320，中英文各截一遍图；
   - 检查链接、锚点、`?lang=`、`#cat-*` 深链；
   - Lighthouse 不低于旧版。
5. 改写 `deploy.sh`（见 §6），nginx 加 `/content/` 和旧 URL 的 301，上线。
   这一步不依赖 CMS，可以单独上线，降低风险。

## 3. Vectra 后端（`portal_api`）

按仓库约定分层：routes → Controller → Service → Repository，规则放在 `domain/tbts/`。参照模板是 2026-10-16 的「DIY 我的 Dashboard」（TV slides），它同样有新角色、OSS 上传和免登录读取接口。

开工前先跑 `bin/mirror_diff.sh`，或者直接从生产拉取文件，因为 `remote_edit` 镜像不保证是最新的。

### 3.1 角色 `tbts_admin`

- 迁移 `migrations/2026MMDD_tbts_cms.sql`：
  ```sql
  INSERT INTO additional_role_dict (role_key, role_name_zh, is_enabled)
  SELECT 'tbts_admin', 'Tea By The Sea 官网管理员', 1
  WHERE NOT EXISTS (SELECT 1 FROM additional_role_dict WHERE role_key = 'tbts_admin');
  ```
- `domain/tbts/TbtsAccess.php`：`ADMIN_ROLES = ['all', 'tbts_admin']`，每个管理接口都校验。
  - 系统里没有超管自动放行，所以要显式写上 `all`。
  - 已定：`superAdmin` **不**给权限。前后端都只认 `tbts_admin` 和 `all`。
- 角色由超管在 Admin Panel 里通过 `additional_roles` 分配给员工，下一次请求就生效，菜单靠权限指纹自动刷新。

### 3.2 数据表

全部用 `utf8mb4_0900_ai_ci`。不要照抄 TV slides 迁移里的 `unicode_ci`，那个违反仓库规范。

| 表 | 用途 | 主要字段 |
| --- | --- | --- |
| `tbts_setting` | 门店信息、链接、SEO，按 key 存 JSON | `setting_key` PK, `value_json`, `updated_by`, `updated_at` |
| `tbts_block` | 首页各区块文案和图片引用 | `block_key` PK, `content_json`, `is_visible`, `updated_by`, `updated_at` |
| `tbts_tea` | 茶底 | `id`, `slug` UK, `name_en/zh`, `desc_en/zh`, `notes_en/zh`, `roast`, `ferment`, `media_id`, `sort_order`, `is_enabled`, 时间戳 |
| `tbts_menu_category` | 菜单分类 | `id`, `slug` UK, `name_en/zh`, `chowbus_category_id`, `sort_order`, `is_enabled` |
| `tbts_menu_item` | 菜单商品 | `id`, `category_id`, `name_en/zh`, `desc_en/zh`, `price_cents`, `price_has_options`, `sizes_json`, `price_source`(chowbus/manual), `chowbus_item_id`, `chowbus_prototype_id`, `chowbus_seen_at`, `tags_json`, `media_id`, `is_featured`, `sort_order`, `is_enabled`, 时间戳 |
| `tbts_media` | 媒体库 | `id`, `oss_key` UK, `url`, `sha1` UK, `mime`, `width`, `height`, `bytes`, `alt_en/zh`, `source`(project/upload/chowbus), `uploaded_by`, `created_at`, `deleted_at` |
| `tbts_release` | 发布记录，内容是不可变快照 | `id`, `snapshot_json`(MEDIUMTEXT), `note`, `created_by`, `created_at`, `deploy_status`(pending/deploying/live/failed), `deploy_log`, `deployed_at`, `rollback_of` |
| `tbts_inquiry` | 活动咨询 | `id`, `name`, `email`, `phone`, `event_date`, `guests`, `details`, `lang`, `ip`, `ua`, `status`(new/claimed/replied/closed/spam), `handled_by`, `handled_at`, `wecom_response_code`, `created_at` |
| `tbts_chowbus_sync` | Chowbus 同步记录 | `id`, `started_at`, `finished_at`, `status`, `items_seen`, `price_changes_json`, `unmatched_json`, `missing_json`, `error`, `release_id` |

- 草稿就是这些业务表本身。发布时把整站数据导出成快照，存进 `tbts_release`。
- 回滚不改业务表，而是把旧快照另存为一条新 release（记 `rollback_of`）再推送，这样历史完整。
- 并发编辑：每条记录带 `updated_at`，PUT 时作为乐观锁比对，冲突返回 `tbts.edit_conflict`。

### 3.3 管理 API（需登录，校验 `TbtsAccess`）

前缀 `/backend_v2/tbts/`，路由文件 `routes/tbts.php`，注册函数 `registerTbtsRoutes`。

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET/PUT | `settings` | 门店信息、营业时间、链接、SEO |
| GET | `blocks` | 全部区块和各自的 schema |
| PUT | `blocks/{key}` | 保存单个区块，按 schema 校验 |
| GET/POST | `teas` | 列表 / 新增 |
| PUT/DELETE | `teas/{id}` | 编辑 / 删除 |
| PUT | `teas/sort` | 拖拽排序 |
| GET/POST/PUT/DELETE | `menu/categories[/{id}]` | 分类 |
| PUT | `menu/categories/sort` | 分类排序 |
| GET/POST/PUT/DELETE | `menu/items[/{id}]` | 商品，列表分页、筛选，`ORDER BY` 末尾带唯一键 |
| PUT | `menu/items/sort` | 分类内排序 |
| PUT | `menu/items/batch` | 批量改价、上下架、移动分类 |
| GET | `media` | 媒体库分页，支持「未被引用」筛选 |
| POST | `media` | multipart 上传图片（见 §4） |
| PUT | `media/{id}` | 修改 alt |
| DELETE | `media/{id}` | 软删除；仍被引用时拒绝并列出引用处 |
| GET | `draft/diff` | 草稿与线上版本逐项对比，发布前确认用 |
| POST | `preview-token` | 生成 30 分钟有效的预览令牌 |
| GET/POST | `releases` | 发布历史 / 发布（带备注） |
| GET | `releases/{id}` | 详情和部署日志，前端轮询状态 |
| POST | `releases/{id}/rollback` | 回滚到该版本 |
| POST | `releases/{id}/redeploy` | 部署失败时重推 |
| GET/PUT | `inquiries[/{id}]` | 咨询线索列表 / 改状态和备注 |
| GET | `chowbus/status` | 最近一次同步结果、未匹配和已下架的商品 |
| POST | `chowbus/sync` | 立即同步一次 |
| PUT | `menu/items/{id}/chowbus-link` | 手动绑定或解绑 Chowbus 商品 |

- 每个错误出口都要在 `resources/api_errors/keys.php` 注册 `tbts.*` 的 error_key（含 zh、en），前端随后跑 `pnpm sync:api-error-keys`。
- 写操作记 `updated_by`。发布和回滚记操作人，用 `user.userAgentName`（规范姓名）。

### 3.4 公开 API（免登录，给官网用）

前缀 `/backend_v2/mc/tbts/`，Controller 不调用 `getAuthenticatedUser()`。每个接口都先过 `ScrapeShield::inspectPublic` 限流，响应字段只输出 schema 里允许的字段。

| 方法 | 路径 | 用途 |
| --- | --- | --- |
| GET | `content` | 最新已发布快照，Redis 缓存，发布时清除。官网打包时用（`fetch-content.mjs`），也可作为监控探针 |
| GET | `content/preview?token=` | 预览当前草稿；令牌校验失败返回 403 |
| POST | `inquiries` | 活动和场地咨询。含 honeypot、限流、字段校验；落库后按 §3.5 推送企业微信 |

- 运行时官网读的是同域静态文件 `/content/site.json`，不直接打这些接口，所以不需要给 `api.portal.uswoo.cn` 配 CORS。
- 只有咨询表单需要从浏览器跨域 POST。处理方式二选一：
  - 在 .198 的 nginx 上把 `/api/inquiry` 反代到 Vectra（推荐，同域、不暴露 API 域名）；
  - 或在 panel 的 nginx CORS map 里加入 `https://teabytheseaboston.com`。
- 预览页由官网自己提供：`/?preview=<token>` 会改为拉 `content/preview`，并显示「预览中」横条。这个接口需要 CORS，或者同样走 .198 的反代 `/api/preview`。推荐统一反代 `/api/`。

### 3.5 咨询表单 → 企业微信

官网「场地租赁」表单改为真正提交，不再只生成邮件草稿：

1. 官网经同域反代 `POST /api/inquiry` 提交到 `/backend_v2/mc/tbts/inquiries`。
   - 字段：姓名、邮箱、电话（选填）、日期、人数、需求说明。
   - 防刷：honeypot 字段，以及单 IP 每小时 5 次的限额。
   - 成功后页面提示「已收到，我们会尽快联系你」。失败时退回原来的 mailto 链接，不丢客户。
2. 落库 `tbts_inquiry`，状态为 new。
3. 推送对象：所有在职、`additional_roles` 精确包含 `tbts_admin` 的员工（取 `qy_userid`），**不推给只有 `all` 的人**。
   - 先用 `LIKE` 粗筛，再在 PHP 里精确判断，和 `RentDisbursementRecipientRepository` 的做法一样。
4. 消息用企业微信**模板卡片**（`button_interaction`），这就是「在企业微信收集和处理表单」：
   - 卡片内容：客户姓名、联系方式、日期人数、需求摘要（按 `WecomMessageLimits` 预算长度）。
   - 按钮：「我来跟进」「已回复」「无效 / 垃圾」。
   - 回调走现有的 `template_card_event` 分发，参照 `MeetingRoomController::dispatchTemplateCardEvent()` 和 `ReminderController`。
     - 收到回调后更新 `tbts_inquiry` 的状态和处理人；
     - 再用 `WecomTemplateCardGateway::updateTemplateCard()` 把**所有收件人**的卡片都改成「张三已跟进」，避免两人同时去回复。
   - 卡片底部跳转到 Vectra 的「咨询线索」详情页，能看全文和历史。
   - 用哪个企微应用发，要按 `settings/WeComButtonCapability.php` 选一个已配置回调的应用。
   - 文案按 `resources/i18n/notifications.php` 写五种语言，按收件人的语言发送。
5. 卡片发送失败的人记日志；全部失败时，退回发送普通文本消息。
6. 如果你说的「在企业微信收集表单」是指写进企业微信的**智能表格**（多人在线表格），可以再加一步，调用 `wedoc/smartsheet/add_records` 追加一行。
   - Vectra 目前没有接过文档 API，企微应用需要额外开通文档权限。
   - 先按卡片方案做，智能表格作为可选的增量。

### 3.6 菜单价格与 Chowbus 同步

调研结论（2026-10-26）：

- **官方渠道**：Chowbus 没有公开的开发者 API。合作方（例如 Maple）是拿 Chowbus 发的 API key 同步菜单、价格和库存，说明官方 API 存在但不公开，需要找 Chowbus 客户经理申请。
- **点单页用的接口**：不需要登录，一次请求就能拿到整份菜单。
  - `GET https://api.chowbus.com/compendium/api/v1/online_ordering/restaurants/13845/menus`
  - 返回约 66KB。当前是 1 个菜单、15 个分类、75 个商品。
  - 商品字段：`id`（meal_instance）、`meal_prototype_id`、`name`（英文，小写）、`foreign_name`（中文）、`price`（美元字符串，如 `"7.5"`）、`can_customize`、`stock`（`null` 表示不限量，`0` 应该表示售罄）、`image_url`、`description`。
  - 分类字段：`category_id`、`name`、`foreign_name`、`sequence`。
  - 在线点单里隐藏的商品不会出现在返回结果里。
  - 加料价格（如珍珠 $0.95、芝士奶盖 $1.5）在另一个接口里，按商品 id 查：`meal_instances?meal_instance_ids=…&includes=customized_property_tree`。
- **风险**：这是未公开的内部接口，随时可能改格式或加鉴权。这是自家门店的数据，`robots.txt` 也没有限制，但毕竟不是正式集成。

已定（2026-10-26）：**先用点单页接口同步**，以后拿到正式 API 时只需替换数据源这一层。

首次手动同步已完成，见 [`chowbus-sync-2026-10-26.md`](chowbus-sync-2026-10-26.md)（核对表）和 [`chowbus-mapping.json`](chowbus-mapping.json)（对应关系）：

- Chowbus 74 个商品，与网站 74 个商品全部按分类加英文名对上，价格全部一致。
- 规格价和加料价都已一并取到。

**核对表经你确认后，这份 mapping 就是 CMS 导入的唯一依据。**

1. 数据源封装成 `gateways/ChowbusMenuGateway.php`，只暴露「拉取菜单 → 标准化结构」。
   - 请求带说明来源的 User-Agent，超时 15 秒。
   - 返回结构要严格校验，校验不通过就当作这次同步失败。
2. 每 30 分钟同步一次，注册为 Cron Manager 的定时任务 `tbts_chowbus_sync`；Vectra 里也可以手动点「立即同步」。
   - 每次只发 1 个请求。加料价格每天同步一次，把所有 id 合在一个请求里。
3. 匹配商品：用 `chowbus_item_id` 对应，`chowbus_prototype_id` 作为备用。
   - 首次导入直接读取 `docs/chowbus-mapping.json`，不再做名称匹配；之后只认 id。
   - 同一商品挂在多个分类时，按原型 ID 同步价格。目前只有「芋泥啵啵奶茶」：3367086 和 4405090 → 原型 1583387。
   - 分类用 `category_id` 对应。
   - 以后 Chowbus 新增的商品，按名称给出候选，在「Chowbus 同步」面板里人工确认绑定。
4. 价格规则：
   - 绑定了 Chowbus 的商品，价格以 Chowbus 为准（`price_source = chowbus`），在 Vectra 里只读。
   - 显示为 `$7.50`；`can_customize` 或有规格时显示 `$7.50+`。起价就是中杯价，与现在网站的写法一致。
   - 同时保存规格价（`tbts_menu_item.sizes_json`：中杯、大杯、热饮，美分），菜单页可以显示「中杯 $6.50 · 大杯 $7.50」。是否展示由 CMS 开关控制，默认不展示，保持现在的样子。
   - 加料价目表（珍珠、芋泥、芝士奶盖等）每天同步一次，存在 `tbts_setting.chowbus_toppings`，菜单页可以选择展示一张「加料」小表。
   - 没绑定的商品（比如官网独有的展示项）用手填价格（`price_source = manual`）。
5. 发生变化时：
   - **只有价格变了**：自动更新业务表并**自动发布**一个新版本（备注「Chowbus 价格同步」），用企业微信通知 `tbts_admin`，列出改了哪些价格。
   - **Chowbus 新增了商品，或商品从点单页消失**：不自动改官网，在「Chowbus 同步」面板和企业微信通知里列出来，由人决定是上架、绑定还是下架。
   - **售罄**（`stock = 0`）：可选，在官网商品上显示「今日售罄」角标，同样走自动发布。
   - 自动发布时如果草稿里有别人没发布的修改，就只把价格合并进**线上快照**另存为新版本，不夹带未审核的草稿。
6. 拉取失败或格式变了：保留上一次的数据，官网不受影响；连续失败 3 次推送告警给 `tbts_admin`，并提醒「接口可能已变化」。
7. 图片规则（已定）：**项目里已有的图优先。**
   - 56 个饮品、甜品和点心用 `assets/img/drinks/` 下的现有图片。
   - 项目里没有图的 18 个（零食 11、零售 4、汽水 3），在首次导入时把 Chowbus 图下载一次，转存到 `ossedu-pic-public/tbts/media/`，记入媒体库，并标注来源为 Chowbus。
   - 以后 Chowbus 新增的商品也这样处理：先用 Chowbus 图转存的版本占位，可在 CMS 里替换。
   - 官网从不直接引用 Chowbus 的 `image_proxy` 链接。

## 4. 图片与 OSS

- **Bucket**：`ossedu-pic-public`，地域 **us-west-1（美国硅谷）**，已用 endpoint 探测确认。
- **权限**：bucket 本身是**私有**的，不改。每个上传的对象都要**单独设成公共读**（public-read）。
  - 上传时带请求头 `x-oss-object-acl: public-read`。
  - 不带这个头的对象继承 bucket 的私有权限，通过 CDN 访问会返回 403。
- **对外域名**：CDN `public-pic.uswoo.cn`。它是阿里云 CDN（CNAME `public-pic.uswoo.cn.w.kunlunaq.com`），回源到这个 bucket。
- 官网图片统一放在 `tbts/` 前缀下：

```
https://public-pic.uswoo.cn/tbts/media/{yyyy}/{sha1}.{ext}
```

**`oss_config` 补一行**：AccessKey 与现有记录一致，复制过去，不在迁移文件里写明文。迁移需人工审批：

```sql
INSERT INTO oss_config (bucket, endpoint, public_endpoint, internal_endpoint, accelerate_endpoint, access_key, secret)
SELECT 'ossedu-pic-public',
       'oss-us-west-1.aliyuncs.com',
       'public-pic.uswoo.cn',
       'oss-us-west-1-internal.aliyuncs.com',
       'oss-accelerate.aliyuncs.com',
       access_key, secret
FROM oss_config WHERE bucket = 'oss-mumu2'
  AND NOT EXISTS (SELECT 1 FROM oss_config WHERE bucket = 'ossedu-pic-public');
```

- 列名以生产表结构为准，P0 先 `SHOW CREATE TABLE oss_config` 核对一遍。
- panel 不在 us-west-1，上传时不能走 internal endpoint，要用普通或加速 endpoint。具体在 Gateway 里配置。
- 后端用 `new OssStorageGateway($repo, 'ossedu-pic-public')` 上传。
  - 现有的 `uploadLocalFile()` 和 `uploadFileToBucket()` 会带 `attachmentHeaders()`（`Content-Disposition` 等下载用的头），不适合网页直接显示，也不能设置对象权限。
  - 所以在 Gateway 里新增 `uploadPublicObject(string $objectKey, string $localFilePath, string $contentType, string $cacheControl)`，固定带上：
    - `x-oss-object-acl: public-read`
    - `Content-Type`
    - `Cache-Control: public, max-age=31536000, immutable`
    - 不设 `Content-Disposition`
  - 上传后用 `getObjectMeta()`，或者匿名 HEAD 一次 CDN 地址，确认能公开读取，失败就当作上传失败。
  - `tbts_import.php` 导入的项目图、从 Chowbus 转存的图，也都走这一个方法。
- 公开 URL 的前缀放在 `settings/TbtsConfig.php` 的 `publicImageBase = https://public-pic.uswoo.cn`，不写死在业务代码里。

**CDN 验证结果（2026-10-26，用测试图 `tbts/_probe/17588666.png` 实测）：**

| 项 | 结果 |
| --- | --- |
| HTTPS | ✅ DigiCert DV 证书，有效期到 2027-04-26，走 HTTP/2 |
| 匿名读取 | ✅ 200，不存在的对象返回 404，不允许列目录 |
| 图片处理 | ✅ `?x-oss-process=image/resize,w_480/format,webp` 返回 webp；`resize,w_240` 返回 240×240 的 PNG，保留透明通道 |
| CDN 缓存键 | ✅ 不同处理参数分别缓存，不会串 |
| CORS | ✅ 你在 CDN 边缘加了响应头后（2026-10-26 复测）：原图和各种处理后的版本，不论请求带不带 `Origin`、是命中缓存还是回源，都返回 `Access-Control-Allow-Origin: *`、`Allow-Methods: GET,HEAD`、`Max-Age: 86400` |
| 预检请求（OPTIONS） | ⚠️ 返回 200，但 `Access-Control-Allow-Origin: *` 出现了**两次**，CDN 和 OSS bucket 的 CORS 规则各加了一次。浏览器遇到重复的这个头会判定预检失败。读图用的普通 GET 不会触发预检，所以 `<img>`、canvas 和 `fetch` 读图都不受影响。等以后真要用到需要预检的请求时，再关掉其中一边 |
| HTTP 跳 HTTPS | 未开，`http://` 直接返回 200。官网只用 https 地址，不影响 |
| 原图的 `Cache-Control` | 测试图没有设置。我们自己上传的对象会显式设成一年 immutable |

上传流程，在服务端完成，复用 TV slides 的 GD 处理：

1. 前端在浏览器里先压缩，长边不超过 2400px，复用 `checkPickupImage.ts` 的思路；可选 cropperjs 裁剪。然后 multipart 发到 `POST /backend_v2/tbts/media`。
2. 后端：
   - 校验真实 MIME（jpeg/png/webp）和大小，不超过 10MB；
   - GD 读取 EXIF 方向后纠正；
   - 计算 sha1 去重；
   - 保留 PNG 的透明通道，饮品抠图都是透明 PNG，**不能像 TV slides 那样统一转成 JPEG**。
3. 上传到 `ossedu-pic-public` 的 `tbts/media/{yyyy}/{sha1}.{ext}`：
   - 用 `uploadPublicObject()`，对象权限设为 **public-read**，并设置 `Cache-Control: public, max-age=31536000, immutable`；
   - 内容一变 key 就变，CDN 永不需要刷新；
   - 删除只做软删除，不删 OSS 上的对象，避免旧的发布版本回滚后图片失效。
4. 写入 `tbts_media`，返回 `{id, url, w, h}`。

迁移时，`bin/tbts_import.php` 把现有 `assets/img/` 的所有图片一次性上传（`source=project`），并建立 `原路径 → media_id` 的映射。没有项目图的菜单商品按 §3.6 第 7 条，从 Chowbus 转存（`source=chowbus`）。

## 5. Vectra 前端（`uswoo_portal`）

- 路由 `src/router/modules/tbts.ts`：
  - rank 取管理分组里空闲的 452–459；
  - `meta.roles: ["tbts_admin", "all"]`；
  - 菜单标题 `menus.tbts*`，五种语言都要写；
  - 页面文案放 `locales/tbts/{zh-CN,en,zh-TW,zh-HK,zh-MO}.yaml`，繁体三地逐条手写，不得机器转换。
- 权限镜像 `src/features/tbts/access.ts`；API 封装 `src/api/tbts.ts`，路径以 `/backend_v2/tbts/...` 开头。
- 页面（keepAlive 的路由名必须和 `defineOptions({ name })` 一致）：

| 页面 | 内容 |
| --- | --- |
| 概览与发布 | 线上版本、草稿改动数、「预览」和「发布」按钮，发布前弹出 diff 确认；发布历史表格（pure-table），每行可回滚或重推；部署状态轮询 |
| 门店信息 | 名称、电话、邮箱、地址（中英）、每周营业时间编辑器、点单 / 社交 / App 链接、SEO 标题描述和分享图 |
| 首页内容 | 左侧列出各区块，右侧按 schema 生成表单（中英并排、图片选择、显示 / 隐藏） |
| 茶底 | 卡片列表，vuedraggable 拖拽排序；编辑弹窗含中英名称、描述、风味、烘焙和发酵度滑块、图片 |
| 菜单 | 左侧分类可拖拽排序和增删改，右侧该分类的商品表格（缩略图、名称、价格及来源、Chowbus 绑定状态、标签、上下架开关）；支持拖拽排序和批量上下架、移动分类；有搜索。Chowbus 来源的价格只读 |
| Chowbus 同步 | 最近一次同步时间和结果、价格变更历史、待处理的新增和消失商品（一键绑定、上架、下架）、首次导入时的名称匹配确认、「立即同步」按钮 |
| 媒体库 | 网格展示，支持拖放和粘贴上传、alt 编辑，查看引用处，筛选未使用的图片；同时以 `MediaPicker` 弹窗形式供其他页面选图 |
| 咨询线索 | 列表（状态、处理人、提交时间）、详情、改状态和备注；和企业微信卡片的按钮状态双向同步 |

- 规范要求：
  - 表格用 pure-table，不用原生 el-table；
  - 弹窗加 `align-center`；
  - toast 用 `message()`，错误提示写成 `getErrorMessage(err) || 兜底`；
  - 不对 props 用 `v-model`，改用 `defineModel`；
  - 移动端筛选一行两项。
- 验证：`pnpm validate:fast`。仓库规定 agent 不跑 build 和 dev，界面由你手测。上线方式是 push main，CI 自动部署。

## 6. 部署与发布

### 6.1 官网代码（本地打包，经跳板机上传）

`scripts/deploy.sh` 改为：

1. 检查工作区干净，并记录 HEAD。
2. `node scripts/fetch-content.mjs`：从 `/backend_v2/mc/tbts/content` 拉取最新已发布快照，写入 `fallback.json`。拉取失败就中止，避免把旧内容预渲染进页面。
3. `pnpm build`，输出 `dist/`：每个路由一份 HTML，资源带 hash。
4. `tar -C dist -cf - .` 通过 `ssh panel.uswoo.cn 'ssh root@172.27.235.198 …'` 管道上传，沿用现在的 `.new → 替换 → .prev` 原子切换、权限设置和 `.revision` 文件。
5. 上线后自检：curl 首页、`/menu`、`/content/site.json` 和一个 hash 资源，确认都是 200。

回滚：`mv $SITE_DIR.prev $SITE_DIR`，和现在一样。

### 6.2 内容发布（Vectra 点「发布」）

PHP-FPM 以 `www` 用户运行，没有 SSH 权限，所以推送交给 root 运行的按需任务：

1. `POST releases`：在事务里生成快照，写入 `tbts_release`（状态 pending），清除 Redis 缓存，然后调用 `CronDemandService::notify('tbts_publish')`。
2. 按需任务 `cron/jobs/tbts_publish.php` 由 supervisor 的 demand worker 以 root 执行，通过 `CronDemandRegistry` 注册：
   - 取出 pending 的 release；
   - 把 JSON 经 `ssh -o BatchMode=yes root@172.27.235.198` 写到 `/data/sites/teabytheseaboston.com-content/site.json.tmp`，再 `mv` 成 `site.json`，保证原子替换；
   - 同时保存一份 `v/{id}.json` 备查；
   - 回写状态为 live 或 failed，并记录日志。

   panel 到 .198 的免密 SSH 已经验证可用。
3. 失败时推送企业微信给操作人；前端可以一键重推。

### 6.3 nginx 改动（`scripts/nginx/teabytheseaboston.com.conf`）

- `location = /content/site.json { alias …-content/site.json; add_header Cache-Control "no-cache"; }`：配合 ETag，每次都向服务器校验，内容没变时只回 304。
- 带 hash 的 `/assets/*`：`Cache-Control: public, max-age=31536000, immutable`。
- `location /api/ { proxy_pass https://api.portal.uswoo.cn/backend_v2/mc/tbts/; }`：给预览和咨询表单用，按需开启，并限制请求体大小。
- 旧 URL 301：`/menu.html → /menu`，`/privacy.html` 和 `/terms.html` 同理。
- CSP 的 `img-src` 加上 `https://public-pic.uswoo.cn`；`connect-src` 保持 `self`，因为咨询和预览都走同域 `/api/`。

### 6.4 GitHub Pages

已定：**停用。** P1 上线时：

- 删除 `.github/workflows/pages.yml`；
- 在 GitHub 仓库设置里关掉 Pages，需要你操作，或者我用 `gh api -X DELETE repos/ynliao99/tbts/pages` 关闭；
- README 里去掉 Pages 的说明。

线上预览改用 CMS 的预览令牌。

## 7. 分阶段实施与验收

| 阶段 | 内容 | 验收 |
| --- | --- | --- |
| P0 准备 | CDN 的 HTTPS、图片处理、CORS 都已验证通过（§4）。我：核对 `oss_config` 表结构，准备补行 SQL 和迁移 SQL 给你审批；上传测试图到 `tbts/`；确认用哪个企微应用发卡片（§3.5）；顺便向 Chowbus 客户经理申请正式 API | `https://public-pic.uswoo.cn/tbts/test.png` 匿名可读且带 CORS 头；缩放和 webp 有结论 |
| P1 官网 Vue 化 | §2 的全部内容，内容来自本地 `fallback.json`；部署脚本和 nginx 改造 | 与旧站逐页截图对比无差异；iOS 真机检查页头、菜单、全屏遮罩；Lighthouse 不退步；上线、能回滚 |
| P2 后端 | 迁移（角色和表）、管理 API、媒体上传、公开 API、发布任务、error_key、CHANGELOG；导入脚本 `bin/tbts_import.php` 把 legacy 快照和全部图片导入，生成 release #1 | `tests/run_all.php --with-db` 新增 tbts 用例；`api_error_key_check`、`layering_check`、`portal_public_url_check` 通过；`composer dump-autoload` 后重启 worker；用 curl 走通管理、公开和发布链路 |
| P3 Vectra 前端 | §5 的全部页面、五种语言、CHANGELOG | `pnpm validate:fast` 全过；你在 Vectra 中手测 |
| P4 打通上线 | 官网改为读 `/content/site.json` 加预览模式；`fetch-content` 接入部署脚本；端到端测试：改价 → 预览 → 发布 → 线上生效 → 回滚 | 发布后 10 秒内线上可见；Vectra 停服时官网正常；回滚生效 |
| P5 咨询和 Chowbus | 后端：咨询接口、企微卡片和回调、`tbts_chowbus_sync` 任务、Chowbus 名称首配。前端：咨询线索页、Chowbus 同步面板。官网：表单改为真正提交 | 提交测试咨询后，所有 `tbts_admin` 收到卡片，一人点「我来跟进」后所有人的卡片同步更新；在 Chowbus 改一个价格，30 分钟内官网自动更新并收到通知；接口格式异常时官网不受影响并有告警 |
| P6 可选 | 售罄角标；智能表格同步；季节限定定时上下架 | 按需 |

建议的顺序：P1 可以和 P2 同时进行。P3 依赖 P2 的接口。P4 打通 CMS 主链路。P5 在 P4 之后，它的后端部分也可以和 P3 并行。

每个仓库各自提交，每次提交都要写对应的 CHANGELOG：

- Vectra 前端写 `docs/CHANGELOG.md`
- Vectra 后端写根目录的 `CHANGELOG.md`，两边互相引用 commit
- 官网仓库在 README 里记录

## 8. 风险与对策

| 风险 | 对策 |
| --- | --- |
| Vue 重写后出现视觉或交互回退，尤其是上一轮修过的 iOS 问题 | P1 只迁移、不改设计；逐条核对 iOS 修复清单；多宽度截图对比；先上线 P1，稳定后再接 CMS |
| 运营改坏页面 | block 用固定 schema，不提供自由排版；必填项和长度在后端校验；发布前看 diff 加预览；一键回滚 |
| Vectra 宕机或变慢影响官网 | 运行时只读同域静态 JSON；预渲染 HTML 本身包含完整内容 |
| 公开接口被刷 | ScrapeShield 限流；只读接口走 Redis 缓存；咨询接口加 honeypot 和单 IP 限额 |
| 代码部署覆盖内容 | 内容放在站点目录之外的 `-content/` 目录，nginx 用 alias 映射 |
| OSS 和 CDN 费用 | 图片设一年 immutable 长缓存，CDN 命中率高；输出 webp 多尺寸；按 sha1 去重 |
| Chowbus 内部接口变更或加鉴权 | 数据源单独封装成 Gateway；严格校验响应结构，失败就保留旧数据并告警；同时申请正式 API |
| Chowbus 自动改价改错 | 只自动更新已绑定商品的价格；单个价格变化超过 50% 或一次变动超过 20 个商品时，暂停自动发布，改为人工确认 |
| 企微卡片刷屏或漏推 | 只推 `tbts_admin`；按钮状态全员同步；发送失败记录并退回文本消息；Vectra 线索页兜底 |
| `remote_edit` 镜像过期 | 每次改后端前先拉生产文件，再用 `mirror_diff` 比对 |
| SSH 频率触发封禁 | 部署和发布都复用 ControlMaster 连接；发布任务在 panel 本机上执行，只需一跳 SSH |

## 9. 决策记录与待办

已定（2026-10-26）：

| 项 | 决定 |
| --- | --- |
| OSS | `ossedu-pic-public`（us-west-1），CDN 域名 `public-pic.uswoo.cn`，前缀 `tbts/`；`oss_config` 补一行，AccessKey 与现有记录一致 |
| URL | 改为 `/menu`、`/privacy`、`/terms`，旧的 `.html` 地址 301 |
| 可编辑范围 | 首页全部区块 |
| 权限 | 只有 `tbts_admin` 和 `all`；`superAdmin` 没有权限 |
| GitHub Pages | 停用 |
| 咨询表单 | 真正提交到 Vectra，用企业微信卡片推给所有 `tbts_admin`，在企业微信里认领和处理 |
| 菜单价格 | 与 Chowbus 自动对齐，先用点单页接口（§3.6）；首次同步结果全部一致，待你核对 |
| 图片 | 项目里已有的图优先；没有的从 Chowbus 转存到 OSS |

还需要你处理或确认：

1. ~~CDN~~：HTTPS、图片处理、CORS 都已验证通过（§4）。
2. 核对 [`chowbus-sync-2026-10-26.md`](chowbus-sync-2026-10-26.md)，确认商品对应和价格无误。
3. Chowbus 只改价格时，是否允许**自动发布**？我推荐允许，并带 §8 的熔断阈值。
4. 「在企业微信收集表单」是否还需要写进企微智能表格？我的推荐是先只做卡片。
5. 是否联系 Chowbus 客户经理申请正式 API key？
