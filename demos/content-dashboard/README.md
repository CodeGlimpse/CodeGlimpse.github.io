# 内容运营看板：三个独立场景

三套可独立构建的 Hugo 静态演示，共用筛选、排序与汇总逻辑，各自拥有品牌、内容、时期、发布类别和 24 条虚构记录。没有后台、登录、网络数据接口或持久化，不读取浏览器存储；所有图形来自本地原创 CSS / SVG，不依赖外部字体、图片或图表库。

| 场景 / 模板 | 内容与数据 | 版式与交互 |
| --- | --- | --- |
| 桌边编辑部 / DESKNOTE · `classic` | 2026 年 7—9 月的编辑部稿件；博客、视频、社区 | 校样图、蓝绿墨色；指标、渠道图、横向筛选、稿件表 |
| 灯塔传播 / LUMEN · `workspace` | 2026 年 4—6 月“向光桌灯”虚构品牌发布；官网、社媒、邮件 | 深色侧栏工作台、原创传播路径图；总览 / 内容记录切换、月份图、记录详情抽屉 |
| 第七镜 / SEVENTH FRAME · `report` | 2026 年 1—3 月《一间工作室》虚构视频栏目；正片、幕后、预告 | 珊瑚色放映记录封面、原创胶片画格；四章导航、月份图与可收起明细 |

每套内容都在自己的首页 front matter 中定义 `brandName`、`brandEnglish`、`siteTitle`、`description`、`heading`、`intro`、`periodLabel`、`periodRange`、`edition`、`channelLabel` 和本地素材路径。页头、页脚、页面标题、简介及说明页样本栏读取当前首页，避免串入其他场景的品牌与时期。

## 一次选择完整场景

需要 Hugo Extended 0.157.0 与 Python 3.11+；检查器使用标准库 `tomllib` 读取场景配置。当前本地验证环境为 Python 3.13.2，无新增依赖。在本目录运行：

```powershell
# 桌边编辑部
hugo server --config hugo.toml
# 灯塔传播：一次选择布局、内容和数据
hugo server --config hugo.toml,variants/workspace/config.toml
# 第七镜
hugo server --config hugo.toml,variants/report/config.toml
```

替代场景的 `config.toml` 同时指定 `params.demoTemplate`、`contentDir` 和 `dataDir`。不要仅修改外观参数后继续使用经典内容。经典场景保留 `content/`、`data/entries.json`；替代场景分别位于 `variants/<template>/content/` 与 `variants/<template>/data/entries.json`，JSON basename 一致。

集成地址保持 `/demos/content-dashboard/`、`/demos/variants/content-dashboard/workspace/` 与 `/demos/variants/content-dashboard/report/`。集成构建按场景提供内容目录和数据目录，并注入目录与场景菜单链接。菜单标为“场景”，说明“不同场景，切换后进入对应首页，临时操作将重置。”；从说明页切换也直接进入目标首页。独立站未注入参数时不显示主站目录入口。

## 独立构建与严格核对

```powershell
hugo --config hugo.toml,variants/workspace/config.toml --destination 'F:\agents\code\temp\content-dashboard-workspace' --baseURL 'https://example.github.io/dashboard/' --minify --panicOnWarning
python -B -X utf8 scripts/check_build.py 'F:\agents\code\temp\content-dashboard-workspace' --base-url 'https://example.github.io/dashboard/' --check-demo-pages
```

示例域名只用于验证子路径，不表示发布。检查器验证本地链接、素材、说明与必要页面，再按产物的模板标记读取对应源文件，严格核对源 JSON、内嵌 JSON、每条静态表格、指标、月份 / 类别选项以及渠道 / 月份图表。它不会只把固定总量要求取消。集成检查可额外传入精确的 `--catalog-url /demos/` 和各场景首页 `--template-url`；通用内容复制后可省略 `--check-demo-pages`。

## 业务口径与更新

- 发布月份与类别由当前数据生成。每条记录含唯一小写 `id`、非空 `title`、有效 `YYYY-MM-DD` 的 `published`、非空且无控制字符的 `channel`，以及非负安全整数 `views`、`interactions`。总量溢出时禁用增强并提示数据不可读。
- 互动率为总互动 ÷ 总阅读 × 100%，不平均逐篇互动率；零阅读显示 `0.00%`。一次阅读可有多次反馈，所以互动率允许超过 100%。品牌邮件的示例打开次数、视频的示例打开或播放次数均使用同一“阅读次数”字段，不表示送达率、转化、完播率或独立人数。
- 筛选组合月份、类别和标题中的全部字面关键词。表格默认阅读次数降序，排序不改变汇总。重置恢复全部范围，刷新或切换场景清除临时状态。
- 工作台切换视图保留筛选，原生 `dialog` 详情显示当前阅读排名、占比与互动率比较；Escape 或关闭按钮返回原入口。手机首次加载收起筛选，手动开关后调整窗口不会重置。
- 报告章节在本页跳转，原生 `details` 明细在增强后默认收起，筛选保留开关状态。关闭 JavaScript 时，工作台两视图同时可见、报告明细展开，全部记录与图表可读，筛选和详情按钮禁用。
- `dashboard-core.js` 共用业务逻辑；`dashboard.js` 校验数据、联动指标与表格；`dashboard-presentation.js` 处理工作台 / 报告交互。布局分模板，`site.css` 始终加载，`workspace.css`、`report.css` 仅在相应场景加载。

更新场景时同步本场景首页、about、JSON 与素材；重新构建后运行仓库根目录的 `node --test tests/content-dashboard.test.cjs`，并运行 `e2e/content-dashboard.spec.cjs`。测试按每套数据验证筛选、排序、零值、详情、无存储 / 网络、键盘、320 / 390 / 800 / 1280px 与无 JavaScript；仍需逐场景截图审查可读性。

虚构样本与本地验证不表示平台接受、运营成果或客户交付。正式使用前应替换示例并确认来源、更新时间、统计口径与公开范围。
