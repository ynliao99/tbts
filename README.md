# Tea By The Sea 官网

东波士顿海边茶饮店 Tea By The Sea 的官网。Vue 3 + Vite，用 vite-ssg 把每个页面预渲染成静态 HTML；
文案、图片、茶底、菜单和价格由 Vectra 里的 CMS 管理（「CMS → Tea By The Sea」，角色 `tbts_admin`）。

## 本地开发

```bash
pnpm install
pnpm dev            # http://localhost:5173 ；没有 src/content/fallback.json 时先拉线上内容，拉不到用初版
pnpm build          # 预渲染到 dist/
pnpm typecheck
pnpm content:fetch  # 用线上已发布的内容覆盖本地 fallback.json
pnpm content:legacy # 用 content/legacy-snapshot.json（CMS 上线前的初版内容）
```

## 结构

```
index.html                 页面模板（首屏前定好语言、识别 iOS/Android）
src/pages/                 首页、菜单、隐私、条款、404
src/components/home/       首页各区块（Hero、招牌三卡、标语、三张好处卡、到店流程、茶底、人气必点、海景、媒体、场地、到店、FAQ、结尾）
src/components/            顶栏、页脚、双语文本 Bi、CMS 图片 OssImage、菜品卡片 Sticker
src/content/               内容类型（与 docs/cms-contract.md 一致）和内容加载
src/composables/           语言切换、营业时间、动效、SEO
src/styles/style.css       全部样式，顶部是颜色 / 字体 token
public/assets/             logo、App 商店徽章、天际线、迁移前的本地图片
content/legacy-snapshot.json  从旧站导出的初版内容（scripts/export-legacy.mjs）
legacy/                    旧的纯静态版本，仅供对照
docs/                      改版计划、CMS 接口契约、Chowbus 菜单核对
```

## 内容从哪来

- 打包时：`scripts/fetch-content.mjs` 从 `https://teabytheseaboston.com/content/site.json` 拉取 CMS 已发布的快照，预渲染进 HTML（SEO 和首屏用）。
- 浏览器里：页面再读一次同域 `/content/site.json`，版本更新就替换。所以在 Vectra 里点「发布」后不用重新打包，几秒内生效。
- `?preview=<token>`：读 CMS 草稿预览（Vectra 里点「预览」生成链接）。
- 价格由 Vectra 每 30 分钟从 Chowbus 在线点单页同步，见 `docs/plan-vue-cms.md` §3.6。

## 发布

线上站点 teabytheseaboston.com 跑在 wordpress-server（内网 172.27.235.198），经 panel.uswoo.cn（Vectra 后端服务器）中转：

```bash
scripts/deploy.sh --dry-run          # 打包并列出将上传的文件
scripts/deploy.sh                    # 发布当前 HEAD（先提交再发布）
scripts/deploy.sh --legacy-content   # CMS 还没发布过内容时，用初版内容预渲染
```

- 发布的是 HEAD 导出的代码，本地打包后只上传页面实际引用到的文件，上一版保留在 `.prev`，回滚见脚本注释
- 内容快照在 `/data/sites/teabytheseaboston.com-content/`，由 CMS 发布任务写入，代码发布不会覆盖
- nginx 配置的源文件是 `scripts/nginx/`（站点配置 + 安全头片段），服务器上在 `/etc/nginx/sites.d/` 和 `/etc/nginx/snippets/`；改完手动上传，再 `nginx -t && systemctl reload nginx`
- 旧地址 `menu.html`、`privacy.html`、`terms.html` 301 到 `/menu`、`/privacy`、`/terms`
- HTTPS 证书是 Let's Encrypt（certbot，证书名 `teabytheseaboston.com`，覆盖裸域和 www），由服务器上的 `certbot-renew.timer` 自动续期，续完自动 reload nginx；`certbot renew --dry-run --cert-name teabytheseaboston.com` 可演练续期
- DNS 在阿里云（ns1/ns2.alidns.com），裸域和 www 经 ESA 回源到 47.89.231.163
- GitHub Pages 已停用
