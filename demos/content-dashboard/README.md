# 观数｜内容运营看板演示

独立的 Hugo 静态站，用虚构的 2026 年第三季度数据演示内容总览、渠道阅读分布、组合筛选和排序。品牌为“观数 / FIELDNOTES”，24 条记录来自示例数据文件，不包含真实客户内容或用户身份，也没有后台、登录、持久化存储或实时接口。

页面以原生 CSS 绘制条形图，不依赖主题、外部字体或第三方图表库。关闭 JavaScript 后仍保留全部指标、渠道图与内容表；筛选排序控件不可用。

## 两种展示模板

`site.Params.demoTemplate` 未设置时使用 `classic`，保留原来的指标、渠道分析、横向筛选与明细表。设置为 `workspace` 后，筛选和统计口径放在桌面侧栏，指标更紧凑，明细以双列卡片呈现；手机上侧栏与卡片会转为单列。说明页使用相同的工作区配色和面板样式。其他模板 ID 会通过 `errorf` 使构建失败，避免误用名称后静默回退。

两版共用 `data/entries.json`、六个 `dashboard-*.html` 内容 partial 和现有 `dashboard.js` 控制器。工作区卡片由同一份明细表加 `static/css/workspace.css` 呈现，筛选、排序、零阅读处理及汇总算法没有第二套实现；无 JavaScript 时也保留完整 24 条卡片明细和所有统计。`css/site.css` 始终加载，变体样式仅在 `workspace` 加载。

集成地址为原版 `/demos/content-dashboard/` 与工作区版 `/demos/variants/content-dashboard/workspace/`。模板切换入口由集成构建提供，切换说明页时保持 `about/` 路由；独立站可用 `[params] demoTemplate = 'workspace'` 或 `HUGO_PARAMS_DEMOTEMPLATE=workspace` 选择外观，不需要复制数据或修改核心逻辑。

## 独立预览与构建

需要 Hugo 0.157.0。在本目录运行 `hugo server`，或构建到临时目录：

```powershell
hugo --destination "$env:TEMP\content-dashboard-build" --baseURL 'https://example.github.io/content-dashboard/' --minify --panicOnWarning
python -B -X utf8 scripts/check_build.py "$env:TEMP\content-dashboard-build" --base-url 'https://example.github.io/content-dashboard/' --check-demo-pages
```

示例地址仅用于检查子路径，不表示站点已部署。`scripts/check_build.py` 支持通用检查与 `--check-demo-pages` 演示检查；真实内容替换后可省略演示选项。博客集成时提供 `demoCatalogURL`，页面才显示“← 返回演示目录”；集成检查可传 `--catalog-url /demos/`，或实际带前缀的目录路径。独立构建不设置该参数。

## 更新内容与数据

- `content/_index.md`：首页标题与简介。
- `content/about/index.md`：数据来源、统计口径与操作说明。
- `data/entries.json`：内容记录数组，每条含唯一 `id`、`title`、`published`、`channel`、`views`、`interactions`。
- `hugo.toml`：站名、页面描述和示例区间；`layouts/`、`static/css/site.css`：页面结构与样式。
- `static/js/dashboard-core.js` 与 `static/js/dashboard.js`：筛选、排序和当前结果的页面更新。

`published` 使用 `YYYY-MM-DD` 日期；当前月份选项为 `2026-07`、`2026-08`、`2026-09`，渠道限定为博客、视频、社区。阅读和互动使用非负整数。扩展月份或渠道时，需要同步页面控件、汇总图和数据说明。替换数据后重新构建，静态页面与脚本会读取同一份 JSON；标题由模板转义，内嵌 JSON 使用 Hugo 的默认 HTML 转义。

互动率使用“总互动 ÷ 总阅读 × 100%”，不平均逐篇互动率；零阅读显示 `0.00%`。表格默认按阅读次数降序，完整数值始终以文字呈现。正式使用前应替换全部虚构数据并确认统计和公开展示范围，本示例数值不代表运营效果保证。
