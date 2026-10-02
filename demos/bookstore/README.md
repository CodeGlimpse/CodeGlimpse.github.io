# 纸间书店

独立 Hugo 静态站，以十二本原创虚构图书演示书目分类、书名搜索和模拟购物袋。文学、设计、生活各四本，包含售罄和限量样本。书名、作者、简介均为虚构；封面由本地 CSS 绘制。页面没有外部字体、图片、CDN、数据请求、账户或后台。

首页和说明页都明确标注“虚构演示 · 模拟购物袋”。购物袋只保存在当前页面内存中，刷新或离开页面即重置；没有结算、下单、支付或个人信息收集。关闭 JavaScript 后仍可阅读完整书目、单价和库存，交互控件保持禁用。

## 页面模板

`checklist`：明黄选书台用紧凑书目、原生简介折叠和行内数量操作，电脑端常驻蓝色小票，手机端小票接在书目之后。额外加载 `static/css/checklist.css`，共用原书目数据和购物袋脚本。集成地址为 `/demos/variants/bookstore/checklist/`；独立预览可设置 `$env:HUGO_PARAMS_DEMOTEMPLATE = 'checklist'`。

`params.demoTemplate` 支持 `classic`、`catalog` 和 `checklist`，未设置时使用 `classic`；其他值会通过 Hugo `errorf` 中止构建，避免输出不完整的模板。

| 模板 | 版式 |
| --- | --- |
| `classic` | 原纸上书架：大封面图书网格与可见购物袋侧栏 |
| `catalog` | 深夜阅览室：单本展台、书脊选择和前后翻书，购物袋由抽屉打开 |
| `checklist` | 明黄选书台：简介折叠、行内数量和常驻蓝色购物小票 |

三套模板共用 `data/books.json`、`content/` 和同一组购物袋脚本。新增的 `.book-copy`、`.book-order` 只是书目分组容器，筛选、库存、金额、按钮名称及焦点逻辑保持一致；说明页同时应用当前模板样式。模板选择只改变页面呈现，不复制内容或保存购物袋。

所有页面先加载 `css/site.css` 与共用的 `css/demo-templates.css`，`catalog` 再加载 `css/catalog.css`。`body[data-template]` 标记当前模板。`layouts/partials/demo-templates.html` 提供模板入口，位于返回演示目录与主导航之间；主站集成通过 `demoTemplates` 提供链接，选择模板时保留当前详情路由。集成构建的阅览室地址为 `/demos/variants/bookstore/catalog/`，主站有前缀时会加上该前缀。

独立预览可在 `hugo.toml` 的 `[params]` 中设置 `demoTemplate = 'catalog'`，或使用当前 PowerShell 会话的参数：

```powershell
$env:HUGO_PARAMS_DEMOTEMPLATE = 'catalog'
hugo server
Remove-Item Env:HUGO_PARAMS_DEMOTEMPLATE
```

最后一条命令在停止预览后执行，用于恢复默认模板。独立构建仍使用下文的构建和检查器，无需新增数据、主题或依赖；默认没有主站注入的模板链接。

## 独立预览与构建

需要 Hugo 0.157.0 与 Python 3.10 或更新版本。在此目录运行 `hugo server`，或构建到临时目录：

```powershell
hugo --destination "$env:TEMP\bookstore-build" --baseURL 'https://example.github.io/bookstore/' --minify --panicOnWarning
python -B -X utf8 scripts/check_build.py "$env:TEMP\bookstore-build" --base-url 'https://example.github.io/bookstore/' --check-demo-pages
```

示例地址用于验证子路径，不表示已部署。这个目录可以单独复制、预览和构建，不依赖主站脚本或 Hugo 主题。

导航和本地资源由 Hugo 生成与 `baseURL` 兼容的地址。只有配置 `params.demoCatalogURL` 时才显示“← 返回演示目录”，该链接紧随跳过导航链接，使用配置中的精确地址。集成检查可传 `--catalog-url /demos/`，带主站前缀时则传实际地址，例如 `/project/demos/`。此选项仅允许带 `data-demo-catalog` 标记的链接使用这个精确例外；其他路径仍必须位于本站输出范围内。独立构建不设置此参数。

`scripts/check_build.py` 会检查本地链接和路径逃逸；`--check-demo-pages` 进一步要求首页、`about/`、本 demo 的 CSS 与业务脚本、十二本静态书目和演示声明。

## 内容与数据

- `content/_index.md`：首页标题和简介。
- `content/about/index.md`：操作说明、虚构范围、库存和金额口径。
- `data/books.json`：唯一书目来源；Hugo 静态书目与脚本读取同一份数据。
- `layouts/` 与 `static/css/site.css`：共用页面结构、默认布局和原创 CSS 封面；`static/css/catalog.css`：深夜阅览室、单本展台与书脊导航；`static/css/checklist.css`：明黄选书台、行内数量和常驻蓝色小票。
- `static/js/store-core.js`：可由 Node 或浏览器使用的筛选和购物袋核心。
- `static/js/store.js`：页面控件、稳定的购物袋条目及状态提示。

每条图书记录包含 `id`、`title`、`author`、`category`、`description`、`priceCents`、`stock`、`cover`。`id` 必须唯一，使用小写字母、数字和中间连字符；文字字段不能为空。分类限定为“文学”“设计”“生活”。`priceCents` 为非负安全整数，单位是分；`stock` 为 0—9 的整数。全部示例库存的最高金额合计也必须处于 JavaScript 安全整数范围内。`cover` 对应 CSS 中十二个封面样式：`wind`、`letter`、`rain`、`city`、`space`、`type`、`fold`、`map`、`weekend`、`plant`、`breakfast`、`repair`。

演示检查要求十二本书。扩展分类、封面样式或书目数量时，应同步控件、核心校验、样式、说明和相关测试。替换内容后重新构建。模板转义正文文字；内嵌 JSON 保留 Hugo `jsonify` 的默认 HTML 转义，再使用 `safeJS` 输出，控制器插入文字只使用 `textContent`。

## 交互口径

搜索只匹配书名，统一 NFKC 和大小写；空格分隔的多词按“全部包含”匹配。中文输入期间暂缓更新，输入完成后再筛选。筛选不会清空购物袋。

购物袋以整数分累计：逐本的 `priceCents × quantity` 相加后再格式化展示，没有浮点货币累计。减至零或点击移除都会删除该条目。数量达到库存上限时，增加按钮保留键盘焦点并标记 `aria-disabled`，操作只提示上限。售罄的加入按钮保持原生禁用。购物袋数量更新保留原来的 DOM 节点；移除当前条目后移到相邻同类按钮，移除最后一本时移到购物袋标题。状态播报只包含简明消息。

本仓库中的 `tests/bookstore.test.cjs` 覆盖核心数据、搜索、金额和库存边界；`e2e/bookstore.spec.cjs` 覆盖真实交互、键盘、窄屏、无存储和无 JavaScript。这些集成测试位于父仓库，单独复制此 demo 时不需要它们即可构建。

调整模板后，应分别在三种模板检查多词/中文输入搜索、售罄、库存上限、增减和清空购物袋，以及金额与焦点的一致性；同时检查首页和说明页在 320/390 像素下的布局，以及关闭 JavaScript 后的完整静态书目。

## 展示交互

`classic` 保留原始书架；`catalog` 使用同一份静态书目，一次展示一本，书脊和前后按钮切换，购物袋由原生 dialog 打开；`checklist` 用简介折叠、行内加减数量和常驻小票组织书目。`store.js` 继续统一处理筛选、库存与金额，`reading-presentation.js` 只管理阅览室的选择与抽屉。筛选的 hidden 状态与展台当前书籍状态相互独立。

关闭 JavaScript 时，阅览室显示完整书目和静态购物袋；清单的简介仍可通过原生 details 阅读。动效服从 prefers-reduced-motion，抽屉可用 Escape 关闭并恢复打开按钮焦点。
