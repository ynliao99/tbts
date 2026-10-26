# Tea By The Sea — 官网重做设计说明（`landing-page-design` + `design-to-motion`）

## 1. 设计技能与字体保留说明

| 来源 | 内容 | 本项目怎么用 |
| --- | --- | --- |
| [`elayadesign/ai-design-skills` · `landing-page-design`](https://github.com/elayadesign/ai-design-skills) | 着陆页信息架构、单一主转化入口、强制逐词点亮标语段（B11）、间距与字号尺度、嵌套圆角公式、浮动岛屿导航与全屏移动端菜单 | 重构页面结构、转化层级、间距/圆角尺度与滚动入场动效 |
| [`elayadesign/ai-design-skills` · `design-to-motion`](https://github.com/elayadesign/ai-design-skills) | Website 模式下的卡片分层加载（`card`/`photo`/`wipe`）与离屏暂停的视觉故事循环（B4） | 为三大核心收益 Bento 卡片增加实时故事循环、图片骨架屏柔焦显现与进度擦除动画 |
| 保留活泼可爱字体（用户指定优先） | `Shantell Sans`（可变字体，含 `INFM` 随意度与 `BNCE` 弹跳轴）+ `ZCOOL KuaiLe` 站酷快乐体 + `Outfit` 正文 | 保留手绘活泼可爱的标题、注释与茶底字形，并利用 `BNCE`/`INFM` 可变字体轴在悬停与逐词点亮时产生弹性跳动感 |

## 2. 页面结构与动效层次

1. **浮动玻璃岛屿导航（`.site-header`）**：顶部悬浮药丸导航，支持当前阅读区块高亮（`IntersectionObserver` scroll-spy）、中英双语切换，移动端汉堡按钮纯 GPU `transform` 旋转为 `X` 并展开全屏毛玻璃菜单。
2. **单一主转化首屏（`.hero`）**：
   - 主标题：`Real tea. Harbor air. Boston in view.` / `真茶现泡。海风作伴。波士顿就在眼前。`
   - 唯一主按钮：`Order for pickup`，菜单降为文字链接 `Browse the full menu`。
   - 动效：首屏文案与图片分层入场、照片 3D 鼠标微倾与滚动轻微视差、天际线海浪与海鸥动效、可点击互动的波霸杯吉祥物。
3. **滚动逐词点亮品牌标语（`.tagline`，B11 强制模块）**：基于 `IntersectionObserver` 逐词检测触发线，按阅读顺序逐词点亮并触发可变字体 `BNCE` 弹性跃动。
4. **三大核心收益 Bento 区块（`.benefits`，`design-to-motion` Website 模式）**：
   - 每日现泡原叶茶：小锅现泡温度与香气标签循环 + 萃取度进度条动态擦除。
   - 甜度冰量随心调：甜度与冰量/温热胶囊自动巡检切换 + 杯型摘要实时同步。
   - 全年海景露台：港湾航线虚线路径与渡轮圆点往返轨迹动画。
   - 离开视口自动暂停 `requestAnimationFrame` 时钟，兼顾移动端性能。
5. **三步到店体验（`.journey`）**：选茶底 → 在线点单 → 海滨入口取餐或看海。
6. **八款茶底探索器（`#teas`）**：切换茶底时触发杯身弹性倾倒过渡（`--spring`）、背景有机色块形变、风味信息分层上浮，以及焙火🔥/发酵🍃图标与进度条同步擦除。
7. **人气饮品（`.favs`）**：分类切换触发贴纸卡片错峰入场，图片带骨架屏柔焦加载过渡。
8. **海景露台（`#deck`）、《纽约时报》背书（`.press`）、活动场地预约（`#space`，含前端邮箱与必填项校验）、到店信息（`#visit`）、6 项常见问题（`.faq`）、底部点单召唤（`.final-cta`）与精简页脚（含 `privacy.html`、`terms.html`、`404.html`）**。
9. **无障碍与性能**：全站动效仅操作 `transform`、`opacity`、`filter`，完整支持 `prefers-reduced-motion: reduce`。
