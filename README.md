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

## 内容来源

- 茶底风味、关于我们、场地租赁、联系方式：teabytheseaboston.com
- 菜单、价格、饮品图片：Chowbus 在线点单页（2026 年 10 月抓取）

价格会变动，页面上已注明"以在线点单页为准"；所有"Order online"按钮都跳转到 Chowbus。
