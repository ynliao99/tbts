# Chowbus 菜单手动同步核对表（2026-10-26）

- **数据来源**：Chowbus 在线点单页使用的接口，以下数据都是本次实际调用得到的。
  - 菜单：`GET https://api.chowbus.com/compendium/api/v1/online_ordering/restaurants/13845/menus`
  - 规格和加料：`GET https://api.chowbus.com/compendium/api/v1/online_ordering/meal_instances?meal_instance_ids=<47 个可定制商品的 id，逗号分隔>&includes=customized_property_tree`，一次请求取全部。
- **抓取时间**：2026-10-26 15:25（美东）。Chowbus 菜单 id 51161「Online Menu」，15 个分类。
- **对比对象**：本仓库当前线上的 `js/data.js`。
- **匹配方式**：按分类和英文名，忽略大小写和重音符号。
- **价格写法**：可定制的商品（有杯型、甜度、冰量、加料可选）写成「起价+」，起价就是中杯价；不可定制的写实价。
- **机器可读版本**：[`chowbus-mapping.json`](chowbus-mapping.json)，含分类和商品 id、价格（美分）、规格价、库存、图片来源。CMS 首次导入直接使用这份文件，不再按名称模糊匹配。

**请重点核对**：商品是否对应正确、价格（尤其是大杯价）、两款售罄是否属实，以及图片列。

**需要留意**：

1. 「芋泥啵啵奶茶」在 Chowbus 里同时挂在「芋泥系列」和「奶茶系列」两个分类下。
   - 两条记录的 Chowbus ID 不同（3367086 / 4405090），但原型 ID 相同（1583387），是同一个商品。
   - 网站也是两个分类各列一次，同步时按原型 ID 让两处价格保持一致。
2. Chowbus 上「乐事薯片青柠味」和「乐事岩烧海苔味」库存为 0，网站目前照常显示。
   - 计划在网站上给库存为 0 的商品加「售罄」角标（见计划 §3.6）。
3. Chowbus 点心和汽水类没有中文名，网站也没有，可以在 CMS 里补。
4. Chowbus 的分类顺序和网站不同，网站把奶茶放在前面。分类顺序和商品描述都不从 Chowbus 同步，在 CMS 里自行维护。
5. 图片：有项目图的一律用项目图（56 个饮品、甜品和点心）。项目里没有图的 18 个（零食 11、零售 4、汽水 3），导入时把 Chowbus 的图复制到我们的 OSS 使用。

Chowbus 共 74 个商品，网站菜单共 74 个。按分类和英文名匹配上 74 个，价格一致 74 个；网站有、Chowbus 没有的 0 个。

| # | 分类 | 商品 | 中文名 | 网站现价 | Chowbus 价 | 规格价（Chowbus） | 库存 | 结果 | 图片 | Chowbus ID / 原型 ID |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 季节限定 | Peach Jasmine Green Tea Smoothie | 芝士/满杯桃桃 | $7.50+ | $7.50+ | 仅大杯（仅冰）$7.50 | 不限 | ✅ 一致 | 项目图 `peach-jasmine-green-tea-smoothie.png` | 8335960 / 2973724 |
| 2 | 季节限定 | Peach Jasmine Green Tea | 白桃茉莉绿茶 | $5.50+ | $5.50+ | 中杯 $5.50 / 大杯（仅冰）$6.50 | 不限 | ✅ 一致 | 项目图 `peach-jasmine-green-tea.png` | 8335968 / 2973727 |
| 3 | 芝芝/水果茶系列 | Black Grape Tea Smoothie | 满杯/芝芝黑提 | $7.50+ | $7.50+ | 仅大杯（仅冰）$7.50 | 不限 | ✅ 一致 | 项目图 `black-grape-tea-smoothie.png` | 3222714 / 1411326 |
| 4 | 芝芝/水果茶系列 | Avocado Tea Smoothie | 满杯/芝芝牛油果 | $7.50+ | $7.50+ | 仅大杯（仅冰）$7.50 | 不限 | ✅ 一致 | 项目图 `avocado-tea-smoothie.png` | 3222711 / 1411327 |
| 5 | 芝芝/水果茶系列 | Mango Tea Smoothie | 满杯/芝芝芒芒 | $7.50+ | $7.50+ | 仅大杯（仅冰）$7.50 | 不限 | ✅ 一致 | 项目图 `mango-tea-smoothie.png` | 3222729 / 1411328 |
| 6 | 芝芝/水果茶系列 | Berry Tea Smoothie | 满杯/芝芝莓果 | $7.50+ | $7.50+ | 仅大杯（仅冰）$7.50 | 不限 | ✅ 一致 | 项目图 `berry-tea-smoothie.png` | 3222713 / 1411329 |
| 7 | 芝芝/水果茶系列 | Strawberry Tea Smoothie | 满杯/芝芝草莓 | $7.50+ | $7.50+ | 仅大杯（仅冰）$7.50 | 不限 | ✅ 一致 | 项目图 `strawberry-tea-smoothie.png` | 3222733 / 1411330 |
| 8 | 芝芝/水果茶系列 | Pineapple Tea Smoothie | 满杯/芝芝凤梨 | $7.50+ | $7.50+ | 仅大杯（仅冰）$7.50 | 不限 | ✅ 一致 | 项目图 `pineapple-tea-smoothie.png` | 3222705 / 1411331 |
| 9 | 芝芝/水果茶系列 | Watermelon Tea Smoothie | 满杯/芝芝西瓜 | $7.50+ | $7.50+ | 仅大杯（仅冰）$7.50 | 不限 | ✅ 一致 | 项目图 `watermelon-tea-smoothie.png` | 3222721 / 1411332 |
| 10 | 芝芝/水果茶系列 | Mango Pomelo | 杨枝甘露 | $9.25+ | $9.25+ | 仅大杯（仅冰）$9.25 | 不限 | ✅ 一致 | 项目图 `mango-pomelo.png` | 3222726 / 1411335 |
| 11 | 咖啡系列 | Americano | 美式 | $5.25+ | $5.25+ | 中杯冰 $5.25 / 大杯冰 $6.25 / 中杯热 $5.25 | 不限 | ✅ 一致 | 项目图 `americano.png` | 3222718 / 1411370 |
| 12 | 咖啡系列 | Latte | 拿铁 | $5.50+ | $5.50+ | 中杯冰 $5.50 / 大杯冰 $6.50 / 中杯热 $5.50 | 不限 | ✅ 一致 | 项目图 `latte.png` | 3222697 / 1411371 |
| 13 | 咖啡系列 | Cheese Foam Coffee | 芝士咖啡 | $5.75+ | $5.75+ | 中杯冰 $5.75 / 大杯冰 $6.75 / 中杯热 $5.75 | 不限 | ✅ 一致 | 项目图 `cheese-foam-coffee.png` | 3222720 / 1411372 |
| 14 | 咖啡系列 | Crème Brûlée Coffee | 布蕾咖啡 | $5.75+ | $5.75+ | 中杯冰 $5.75 / 大杯冰 $6.75 / 中杯热 $5.75 | 不限 | ✅ 一致 | 项目图 `creme-brulee-coffee.png` | 3222735 / 1411373 |
| 15 | 椰椰系列 | Coco Mango | 芒果椰椰 | $7.50+ | $7.50+ | 仅大杯（仅冰）$7.50 | 不限 | ✅ 一致 | 项目图 `coco-mango.png` | 3368082 / 1411345 |
| 16 | 椰椰系列 | Coco Red Bean | 红豆椰椰 | $7.50+ | $7.50+ | 仅大杯（仅冰）$7.50 | 不限 | ✅ 一致 | 项目图 `coco-red-bean.png` | 3368097 / 1411344 |
| 17 | 椰椰系列 | Coco Watermelon | 西瓜椰椰 | $7.50+ | $7.50+ | 仅大杯（仅冰）$7.50 | 不限 | ✅ 一致 | 项目图 `coco-watermelon.png` | 3368108 / 1411346 |
| 18 | 芋泥系列 | Fresh Taro Bubble Milk Tea | 芋泥啵啵奶茶 | $6.95+ | $6.95+ | 中杯 $6.95 / 大杯（仅冰）$7.95 | 不限 | ✅ 一致 | 项目图 `fresh-taro-bubble-milk-tea.png` | 3367086 / 1583387 |
| 19 | 芋泥系列 | Fresh Taro Bubble With Milk | 芋泥啵啵牛奶 | $6.95+ | $6.95+ | 中杯 $6.95 / 大杯（仅冰）$7.95 | 不限 | ✅ 一致 | 项目图 `fresh-taro-bubble-with-milk.png` | 3367098 / 1583392 |
| 20 | 鲜果茶 | Fresh Fruit Green Tea | 满满水果绿 | $7.50+ | $7.50+ | 仅大杯（仅冰）$7.50 | 不限 | ✅ 一致 | 项目图 `fresh-fruit-green-tea.png` | 3222716 / 1411336 |
| 21 | 鲜果茶 | Fresh Lemon Green Tea | 仲夏柠檬绿 | $7.50+ | $7.50+ | 仅大杯（仅冰）$7.50 | 不限 | ✅ 一致 | 项目图 `fresh-lemon-green-tea.png` | 3222725 / 1411338 |
| 22 | 鲜果茶 | Fresh Fruit Oolong Tea | 满满水果四季春 | $7.50+ | $7.50+ | 仅大杯（仅冰）$7.50 | 不限 | ✅ 一致 | 项目图 `fresh-fruit-oolong-tea.png` | 3222736 / 1411337 |
| 23 | 鲜果茶 | Fresh Lemon Oolong Tea | 仲夏四季春 | $7.50+ | $7.50+ | 仅大杯（仅冰）$7.50 | 不限 | ✅ 一致 | 项目图 `fresh-lemon-oolong-tea.png` | 3222703 / 1411339 |
| 24 | 鲜果养乐多 | Grapefruit Yakult | 西柚养乐多 | $7.75+ | $7.75+ | 仅大杯（仅冰）$7.75 | 不限 | ✅ 一致 | 项目图 `grapefruit-yakult.png` | 3222696 / 1411341 |
| 25 | 鲜果养乐多 | Orange Yakult | 鲜橙养乐多 | $7.75+ | $7.75+ | 仅大杯（仅冰）$7.75 | 不限 | ✅ 一致 | 项目图 `orange-yakult.png` | 3222700 / 1411342 |
| 26 | 鲜果养乐多 | Lemon Yakult | 柠檬养乐多 | $7.75+ | $7.75+ | 仅大杯（仅冰）$7.75 | 不限 | ✅ 一致 | 项目图 `lemon-yakult.png` | 3222731 / 1411343 |
| 27 | 纯茶系列 | Classic Oolong Tea | 炭焙乌龙茶 | $4.75+ | $4.75+ | 中杯 $4.75 / 大杯（仅冰）$5.75 | 不限 | ✅ 一致 | 项目图 `classic-oolong-tea.png` | 3222699 / 1411348 |
| 28 | 纯茶系列 | Jasmine Green Tea | 高山绿茶 | $4.75+ | $4.75+ | 中杯 $4.75 / 大杯（仅冰）$5.75 | 不限 | ✅ 一致 | 项目图 `jasmine-green-tea.png` | 3222702 / 1411347 |
| 29 | 纯茶系列 | Peach Oolong Tea | 桃香乌龙 | $4.75+ | $4.75+ | 中杯 $4.75 / 大杯（仅冰）$5.75 | 不限 | ✅ 一致 | 项目图 `peach-oolong-tea.png` | 3222695 / 1411351 |
| 30 | 纯茶系列 | Taiwanese Oolong Tea | 冻顶乌龙 | $4.75+ | $4.75+ | 中杯 $4.75 / 大杯（仅冰）$5.75 | 不限 | ✅ 一致 | 项目图 `taiwanese-oolong-tea.png` | 3222704 / 1411350 |
| 31 | 纯茶系列 | Osmanthus Tea | 桂花乌龙茶 | $4.75+ | $4.75+ | 中杯 $4.75 / 大杯（仅冰）$5.75 | 不限 | ✅ 一致 | 项目图 `osmanthus-tea.png` | 3222698 / 1411352 |
| 32 | 纯茶系列 | Earl Grey | 伯爵茶 | $4.75+ | $4.75+ | 中杯 $4.75 / 大杯（仅冰）$5.75 | 不限 | ✅ 一致 | 项目图 `earl-grey.png` | 3222707 / 1411353 |
| 33 | 纯茶系列 | Hawaii Tea | 夏威夷茶 | $4.75+ | $4.75+ | 中杯 $4.75 / 大杯（仅冰）$5.75 | 不限 | ✅ 一致 | 项目图 `hawaii-tea.png` | 3222692 / 1411354 |
| 34 | 亚洲零食 | Jasmine Tea Mint Candy | 铁盒绿箭薄荷糖茉莉花茶味 | $2.95 | $2.95 | — | 20 | ✅ 一致 | Chowbus 图（项目无图） | 8761740 / 2754833 |
| 35 | 亚洲零食 | Oreo Sandwich Cookies Ice Cream Matcha Flavor | 奥利奥夹心饼干冰淇淋抹茶味 | $2.95 | $2.95 | — | 1 | ✅ 一致 | Chowbus 图（项目无图） | 8761753 / 2758613 |
| 36 | 亚洲零食 | Juice Gummies Peach Flavor | 白桃爆浆果汁软糖 | $2.95 | $2.95 | — | 35 | ✅ 一致 | Chowbus 图（项目无图） | 8761769 / 2758616 |
| 37 | 亚洲零食 | Lays Potato Chips Texas Bbq Flavor | 乐事薯片得克萨斯烧烤味 | $2.95 | $2.95 | — | 3 | ✅ 一致 | Chowbus 图（项目无图） | 8761780 / 2758622 |
| 38 | 亚洲零食 | Lays Potato Chips Mexican Chicken Tomato Flavor | 乐事薯片墨西哥鸡汁番茄味 | $2.95 | $2.95 | — | 2 | ✅ 一致 | Chowbus 图（项目无图） | 8761786 / 2758625 |
| 39 | 亚洲零食 | Lays Potato Chips Lime Flavor | 乐事薯片青柠味 | $2.95 | $2.95 | — | 0 | ✅ 一致（Chowbus 售罄） | Chowbus 图（项目无图） | 8761796 / 2758626 |
| 40 | 亚洲零食 | Lays Potato Chips Italian Red Meat Flavor | 乐事薯片意大利香浓红烩味 | $2.95 | $2.95 | — | 9 | ✅ 一致 | Chowbus 图（项目无图） | 8761798 / 2758628 |
| 41 | 亚洲零食 | Lays Potato Chips Roasted Seaweed Flavor | 乐事岩烧海苔味 | $2.95 | $2.95 | — | 0 | ✅ 一致（Chowbus 售罄） | Chowbus 图（项目无图） | 8761801 / 2758629 |
| 42 | 亚洲零食 | Peelable Juice Gummies Green Grape Flavor | 青提剥皮果汁软糖 | $2.95 | $2.95 | — | 不限 | ✅ 一致 | Chowbus 图（项目无图） | 8761802 / 2758632 |
| 43 | 亚洲零食 | Lays Potato Chips Numb & Spicy Hot Pot Flavor | 乐事薯片飘香麻辣锅味 | $2.95 | $2.95 | — | 不限 | ✅ 一致 | Chowbus 图（项目无图） | 8761815 / 2976024 |
| 44 | 亚洲零食 | Oreo Sandwich Cookies Red Bean Flavor-Seasonal Special | 奥利奥夹心饼干春糯豆香味 | $2.95 | $2.95 | — | 不限 | ✅ 一致 | Chowbus 图（项目无图） | 8761819 / 2976027 |
| 45 | 奶茶系列 | Bubble Milk Tea | 经典珍珠奶茶 | $6.50+ | $6.50+ | 中杯 $6.50 / 大杯（仅冰）$7.50 | 不限 | ✅ 一致 | 项目图 `bubble-milk-tea.png` | 3222715 / 1411355 |
| 46 | 奶茶系列 | Green Bubble Milk Tea | 茉香珍珠奶绿 | $6.75+ | $6.75+ | 中杯 $6.75 / 大杯（仅冰）$7.75 | 不限 | ✅ 一致 | 项目图 `green-bubble-milk-tea.png` | 3222709 / 1411360 |
| 47 | 奶茶系列 | Peach Oolong Bubble Milk Tea | 白桃珍珠奶茶 | $6.75+ | $6.75+ | 中杯 $6.75 / 大杯（仅冰）$7.75 | 不限 | ✅ 一致 | 项目图 `peach-oolong-bubble-milk-tea.png` | 3222732 / 1411363 |
| 48 | 奶茶系列 | Taiwanese Oolong Bubble Milk Tea | 冻顶乌龙珍珠奶茶 | $6.75+ | $6.75+ | 中杯 $6.75 / 大杯（仅冰）$7.75 | 不限 | ✅ 一致 | 项目图 `taiwanese-oolong-bubble-milk-tea.png` | 3222734 / 1411362 |
| 49 | 奶茶系列 | Hawaii Bubble Milk Tea | 夏威夷珍珠奶茶 | $6.75+ | $6.75+ | 中杯 $6.75 / 大杯（仅冰）$7.75 | 不限 | ✅ 一致 | 项目图 `hawaii-bubble-milk-tea.png` | 3222717 / 1411365 |
| 50 | 奶茶系列 | Classic Oolong Bubble Milk Tea | 碳焙乌龙珍珠奶茶 | $6.75+ | $6.75+ | 中杯 $6.75 / 大杯（仅冰）$7.75 | 不限 | ✅ 一致 | 项目图 `classic-oolong-bubble-milk-tea.png` | 3222728 / 1411361 |
| 51 | 奶茶系列 | Fresh Taro Bubble Milk Tea | 芋泥啵啵奶茶 | $6.95+ | $6.95+ | 中杯 $6.95 / 大杯（仅冰）$7.95 | 不限 | ✅ 一致 | 项目图 `fresh-taro-bubble-milk-tea.png` | 4405090 / 1583387 |
| 52 | 奶茶系列 | Cheese Foam Milk Tea | 芝士奶茶 | $6.50+ | $6.50+ | 中杯 $6.50 / 大杯（仅冰）$7.50 | 不限 | ✅ 一致 | 项目图 `cheese-foam-milk-tea.png` | 3222730 / 1411356 |
| 53 | 奶茶系列 | Crème Brûlée Milk Tea | 法式布蕾奶茶 | $6.50+ | $6.50+ | 中杯 $6.50 / 大杯（仅冰）$7.50 | 不限 | ✅ 一致 | 项目图 `creme-brulee-milk-tea.png` | 3222693 / 1411357 |
| 54 | 奶茶系列 | Oreo Milk Tea | 奥利奥奶茶 | $6.50+ | $6.50+ | 中杯 $6.50 / 大杯（仅冰）$7.50 | 不限 | ✅ 一致 | 项目图 `oreo-milk-tea.png` | 3222719 / 1411358 |
| 55 | 奶茶系列 | Red Bean Milk Tea | 红豆奶茶 | $6.50+ | $6.50+ | 中杯 $6.50 / 大杯（仅冰）$7.50 | 不限 | ✅ 一致 | 项目图 `red-bean-milk-tea.png` | 3222694 / 1411359 |
| 56 | 精品抹茶系列 | Matcha Latte | 抹茶拿铁 | $7.50+ | $7.50+ | 中杯 $7.50 / 大杯（仅冰）$8.50 | 不限 | ✅ 一致 | 项目图 `matcha-latte.png` | 3965412 / 1759914 |
| 57 | 精品抹茶系列 | Frozen Matcha Latte | 抹茶拿铁冰沙 | $7.50+ | $7.50+ | 中杯 $7.50 / 大杯（仅冰）$8.50 | 不限 | ✅ 一致 | 项目图 `frozen-matcha-latte.png` | 3965425 / 1759919 |
| 58 | 精品抹茶系列 | Strawberrry Matcha Latte | 草莓抹茶拿铁 | $8.25+ | $8.25+ | 中杯 $8.25 / 大杯（仅冰）$9.25 | 不限 | ✅ 一致 | 项目图 `strawberry-matcha-latte.png` | 5209227 / 2128327 |
| 59 | 甜品 | New York Cheesecake | 纽约芝士蛋糕 | $6.99 | $6.99 | — | 不限 | ✅ 一致 | 项目图 `new-york-cheesecake.png` | 5652451 / 2255782 |
| 60 | 甜品 | Key Lime Cheesecake | 青柠芝士蛋糕 | $7.99 | $7.99 | — | 不限 | ✅ 一致 | 项目图 `key-lime-cheesecake.png` | 5652509 / 2255787 |
| 61 | 甜品 | Chocolate Truffle Mousse Cake | 松露巧克力慕斯蛋糕 | $9.99 | $9.99 | — | 不限 | ✅ 一致 | 项目图 `chocolate-truffle-mousse-cake.png` | 5652543 / 2255788 |
| 62 | 甜品 | Pumpkin Cheesecake | 南瓜芝士蛋糕 | $7.99 | $7.99 | — | 不限 | ✅ 一致 | 项目图 `pumpkin-cheesecake.png` | 6269008 / 2422593 |
| 63 | 点心 | Butter Croissant | — | $2.99 | $2.99 | — | 不限 | ✅ 一致 | 项目图 `butter-croissant.png` | 3656274 / 1661087 |
| 64 | 点心 | Sweet Cheese Danish | — | $4.99 | $4.99 | — | 不限 | ✅ 一致 | 项目图 `sweet-cheese-danish.png` | 3656277 / 1661088 |
| 65 | 点心 | Spinach & Feta Savory Pastry | — | $5.59 | $5.59 | — | 不限 | ✅ 一致 | 项目图 `spinach-feta-savory-pastry.png` | 3656278 / 1661089 |
| 66 | 点心 | Matcha Cheese Foam Cinnamon Bun | — | $6.69 | $6.69 | — | 不限 | ✅ 一致 | 项目图 `matcha-cheese-foam-cinnamon-bun.png` | 3656281 / 1661090 |
| 67 | 点心 | Ham & Cheese Croissant | — | $5.99 | $5.99 | — | 不限 | ✅ 一致 | 项目图 `ham-cheese-croissant.png` | 5652631 / 2255791 |
| 68 | 零食和零售用品 | Milk Chocolate Gummy Bear | 牛奶巧克力小熊软糖 | $5.99 | $5.99 | — | 不限 | ✅ 一致 | Chowbus 图（项目无图） | 4801586 / 1941962 |
| 69 | 零食和零售用品 | Ny Espresso Bean Chocolate | 咖啡味巧克力豆 | $5.99 | $5.99 | — | 不限 | ✅ 一致 | Chowbus 图（项目无图） | 4801584 / 1941967 |
| 70 | 零食和零售用品 | Venchi Pistachio Cremino Bar | Venchi 意大利开心果巧克力 | $9.99 | $9.99 | — | 不限 | ✅ 一致 | Chowbus 图（项目无图） | 5796419 / 2294701 |
| 71 | 零食和零售用品 | Nutella Biscuits | — | $6.99 | $6.99 | — | 不限 | ✅ 一致 | Chowbus 图（项目无图） | 5797402 / 2295026 |
| 72 | 汽水&矿泉水 | Coke(Can) | — | $1.99 | $1.99 | — | 不限 | ✅ 一致 | Chowbus 图（项目无图） | 3947432 / 1755004 |
| 73 | 汽水&矿泉水 | Diet Coke(Can) | — | $1.99 | $1.99 | — | 不限 | ✅ 一致 | Chowbus 图（项目无图） | 3947436 / 1755005 |
| 74 | 汽水&矿泉水 | Water(Bottle) | — | $0.99 | $0.99 | — | 不限 | ✅ 一致 | Chowbus 图（项目无图） | 3947450 / 1755010 |

### 加料价格（Chowbus，所有饮品共用）

| 加料 | 价格 | 适用商品数 |
|---|---|---|
| oat milk | $0.75 | 18 |
| aloe | $0.95 | 46 |
| chewy boba | $0.95 | 46 |
| grapefruit pulp | $0.95 | 27 |
| lychee jelly | $0.95 | 46 |
| mango popping boba | $0.95 | 46 |
| oreo | $0.95 | 15 |
| pudding | $0.95 | 46 |
| red bean | $0.95 | 46 |
| taro paste | $0.95 | 15 |
| white boba | $0.95 | 46 |
| coconut milk | $1.00 | 18 |
| cheese foam | $1.50 | 46 |
| crème brûlée | $1.50 | 46 |