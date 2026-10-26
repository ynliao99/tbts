# Tea By The Sea 官网（纯前端）

东波士顿海边茶饮店 Tea By The Sea 的新官网。静态 HTML/CSS/JS，无构建步骤，没有任何依赖。

## 本地预览

```bash
python3 -m http.server 8000
# 打开 http://localhost:8000
```

## 结构

```
index.html        首页：海景首屏 / 茶底介绍 / 人气饮品 / 海景露台 / 纽约时报推荐 / 场地租赁 / 到店
menu.html         完整菜单（分类导航 + 搜索）
css/style.css     全部样式，顶部是颜色 / 字体 token
js/data.js        店铺信息、8 款茶底、完整菜单和价格（改价改这里）
js/main.js        中英切换、营业状态、茶底切换、菜单渲染与搜索
assets/img/       从原官网和 Chowbus 下载并压缩的图片
assets/svg/       手绘波士顿天际线
DESIGN.md         设计调研与设计说明
```

## 发布

线上站点 teabytheseaboston.com 跑在 wordpress-server（内网 172.27.235.198，经 panel.uswoo.cn 中转）：

```bash
scripts/deploy.sh --dry-run   # 看看会上传哪些文件
scripts/deploy.sh             # 发布当前 HEAD（先提交再发布）
```

- 只上传页面实际用到的文件，没被引用的图片不会上传
- 站点目录 `/data/sites/teabytheseaboston.com`，上一版保留在 `.prev`，回滚见脚本注释
- nginx 配置的源文件是 `scripts/nginx/teabytheseaboston.com.conf`，服务器上在 `/etc/nginx/sites.d/`；改完要手动上传，再 `nginx -t && systemctl reload nginx`
- HTTPS 证书是 Let's Encrypt（certbot，证书名 `teabytheseaboston.com`，覆盖裸域和 www），由服务器上的 `certbot-renew.timer` 自动续期，续完自动 reload nginx；`certbot renew --dry-run --cert-name teabytheseaboston.com` 可演练续期
- DNS 在阿里云（ns1/ns2.alidns.com），裸域和 www 都是 A 记录 47.89.231.163

## 内容来源

- 茶底风味、关于我们、场地租赁、联系方式：teabytheseaboston.com
- 菜单、价格、饮品图片：Chowbus 在线点单页（2026 年 10 月抓取）

价格会变动，页面上已注明"以在线点单页为准"；所有"Order online"按钮都跳转到 Chowbus。
