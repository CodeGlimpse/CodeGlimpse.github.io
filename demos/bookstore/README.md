# 三间独立场景的纸上书店

这个目录可单独复制为一个 Hugo 静态站。三套场景分别拥有自己的品牌、首页、说明页、十二本原创虚构图书、价格和库存；核心筛选与购物袋脚本共用。页面不加载外部字体、图片、CDN 或远程数据，没有账户、后台或真实交易。

| 场景 | 品牌与内容 | 布局与本地素材 | 内容、数据目录 |
| --- | --- | --- | --- |
| classic | 纸间文学书店：小说、诗歌、散文各四本 | 文学书架、书页折角、大封面与常驻购物袋 | `content/`、`data/` |
| catalog | 形间艺术书房：图像、设计、建筑各四本 | 白色单本展台、书脊选择、前后翻书、购物袋抽屉；十二幅原创几何 SVG 封面 | `variants/catalog/content/`、`variants/catalog/data/` |
| checklist | 周末生活选书：料理、居家、自然各四本 | 生活清单、原生简介折叠、行内数量、红色购物小票；十二幅原创物件 SVG 封面 | `variants/checklist/content/`、`variants/checklist/data/` |

每套数据都使用 `books.json` basename。三套书名、ID、简介各自独立；首页 frontmatter 保存品牌、期间、主题色、图标与文案，页头、页脚、meta 和说明页由当前首页生成。现有集成 URL 保留：`/demos/bookstore/`、`/demos/variants/bookstore/catalog/`、`/demos/variants/bookstore/checklist/`。

## 独立预览与构建

使用 Hugo 0.157.0、Python 3.10 以上。在本目录执行以下命令，成套选择版式、内容和数据：

~~~powershell
hugo server
hugo server --config hugo.toml,variants/catalog/config.toml
hugo server --config hugo.toml,variants/checklist/config.toml
~~~

`hugo.toml` 默认为 classic；两个 variant config 同时设置 `params.demoTemplate`、`contentDir` 和 `dataDir`。构建艺术书房到子路径的示例：

~~~powershell
hugo --config hugo.toml,variants/catalog/config.toml --destination 'F:/agents/code/temp/bookstore-catalog-build' --baseURL 'https://example.test/review/bookstore-catalog/' --minify --panicOnWarning
python -B -X utf8 scripts/check_build.py 'F:/agents/code/temp/bookstore-catalog-build' --base-url 'https://example.test/review/bookstore-catalog/' --check-demo-pages
~~~

classic 使用 `--config hugo.toml`；checklist 使用 `--config hugo.toml,variants/checklist/config.toml`，并调整输出路径与 base URL。这些地址仅用于本地验证。运行与构建无需父仓库主题、脚本或依赖安装。

## 场景菜单与主站集成

主站通过 `demoTemplate`、`contentDir` 和 `dataDir` 注入当前场景。菜单用“场景”文案，所有链接进入对应首页；在说明页切换也回到新场景首页。提示为“不同场景，切换后进入对应首页，临时操作将重置。”。独立运行默认没有主站入口；仅配置 `params.demoCatalogURL` 才显示“← 返回演示目录”。

`check_build.py` 支持 `--catalog-url` 与多个 `--template-url`，仅允许精确匹配、带标记的主站/场景链接使用例外路径，其他本地链接必须位于 base URL 子路径内。

## 内容与素材

- `content/` 与各 `variants/*/content/`：首页和独立说明页。
- `data/books.json` 与各 `variants/*/data/books.json`：每套唯一书目来源，Hugo 静态页面和内嵌 JSON 使用同一份数据。
- `layouts/partials/book-cover.html`：封面文字与本地素材；classic 使用原创 CSS，艺术与生活场景使用 `static/illustrations/covers/` 内的二十四幅原创 SVG。
- `static/css/site.css`：纸白 `#eef2f5`、海蓝 `#2c5a75`、文字 `#243746`、次文 `#536777`、边线 `#bdcbd3`；本机宋体用于文学标题，无外部字体。
- `static/css/catalog.css`：展台白 `#f7f8fb`、钴蓝 `#234db8`、珊瑚 `#f06450`、黄色 `#ffd749`、蓝灰 `#53617b`；本机无衬线字形配几何出版物。
- `static/css/checklist.css`：薄荷 `#dcefe6`、深绿 `#164f41`、小票红 `#ae392f`、纸白 `#f3f6eb`、次文 `#466556`；清单按阅读顺序左对齐，小票承载当前数量。
- `static/js/store-core.js`、`store.js`：共用筛选、库存、金额和焦点逻辑；`reading-presentation.js` 只管理单本展台与抽屉。

书目字段为 `id`、`title`、`author`、`category`、`description`、`priceCents`、`stock`、`cover`。ID 必须唯一，为小写字母、数字和中间连字符；文字字段非空；分类从当前书目推导，校验器拒绝空值、前后空格、HTML 和保留值 all。价格是非负安全整数，单位为分；库存为 0—9 的整数，所有库存的最高合计金额仍须在 JavaScript 安全整数范围内。封面值必须对应支持的本地样式或 SVG。

## 操作与演示边界

搜索只匹配书名，统一 NFKC 与大小写；空格分隔的多词按全部包含匹配。中文输入期间暂缓更新，输入完成再筛选。筛选不清空购物袋。

数量减至零或移除会删除条目；售罄图书不可加入，数量不超过示例库存。金额使用整数分相乘、相加，再显示两位小数。购物袋只在当前页面内存中保留，刷新、离开或切换场景即重置，没有结算、下单、支付或个人信息收集。

达到库存上限时，按钮保留键盘焦点并标记 aria-disabled。数量变化保留条目 DOM；移除后焦点转向相邻同类按钮，最后一项移除后转向购物袋标题。抽屉支持 Escape 并恢复开启按钮焦点。动效服从 prefers-reduced-motion。

关闭 JavaScript 后完整书目、简介、价格与库存仍可读，分类、搜索和购物袋控件禁用；艺术展台显示全部书籍，生活清单保留原生简介折叠。

## 验证

`scripts/check_build.py --check-demo-pages` 检查页面、资源、子路径、本地链接和声明，并把十二本静态书目的 ID、文字、金额和库存逐项对照内嵌数据及选中场景的源文件。

父仓库中 `node --test tests/bookstore.test.cjs` 覆盖三套数据、搜索、金额、库存上限、零库存、无效数据和独立性。`e2e/bookstore.spec.cjs` 按当前 dataDir 读取真实数据，覆盖 IME、多词搜索、金额、库存、焦点、抽屉、行内数量、320/390 像素和无 JavaScript。无需复制这些父仓库测试即可单独构建。
