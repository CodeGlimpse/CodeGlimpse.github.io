# 五类 demo 的独立场景整理

2026-10-07 完成本地实现、验证和提交。恢复基线为
`6869db47e0351bbf82285e530a412aac0187aef1`。本批没有推送、运行远程 CI 或部署。

## 最终范围

| 案例 | 经典场景 | 第二场景 | 第三场景 |
| --- | --- | --- | --- |
| 创作者 | 岛页插画 | 拾度设计 | 回声单元数字艺术 |
| 数据看板 | 桌边编辑部 | 灯塔传播 | 第七镜视频复盘 |
| 书店 | 纸间文学书店 | 形间艺术书房 | 周末生活选书 |
| 手作预约 | 拾光综合手作 | 岸陶工房 | 折页印作社 |
| 行程规划 | 远山周末 | 巷里漫游 | 岬屿慢行 |

五类共十五套独立场景分别拥有文案、品牌、元数据和原创虚构素材。
创作者共有十二件作品、二十四张原创 SVG，保留原有四个详情目录；
每套看板有二十四条记录、书店有十二本书、工坊有六门课程和十二个场次、
旅行有八处地点。三套工坊分别采用十月、十一月、十二月的示例排期。
摄影的三组真实作品和来源文件保持原样。

经典场景保留 `content/` 与 `data/`；其他场景放在
`variants/<template>/content/`、`variants/<template>/data/`，并提供配套配置。
注册表增加 `dataDir`，构建器同时隔离子站内容与数据目录。业务逻辑按案例共享，
筛选类别和看板月份从当前数据生成。既有集成 URL 保留，从任何页面切换场景均进入目标首页。
目录、五份 README、素材记录、检查器、测试和十五张真实预览图同步更新。

手机复核修正了章节海报的首图位置、看板工作台指标位置、手作标题断行、
纸艺向导首屏和陶艺日历的窄屏日期格。日历在窄屏显示日期、场次数和满额状态，
选择日期后显示完整课程与时间。三张旅行地图的标签在 320/390px 下保持至少
12px 的实际显示字号、位于图面内且彼此不重叠。

## 验证结果

| 检查 | 最终结果 | 证据文件 |
| --- | --- | --- |
| 相关 Node 单元测试 | 258/258 | `unit-final.log` |
| 九份 Chromium spec | 288/288 | `e2e-final.log` |
| `/review/` 场景数据、两两切换、无脚本导航 | 40/40，单独的前缀复验 | `e2e-prefix.log` |
| 默认地址组合构建 | 通过 | `build-final.log` |
| 默认地址十八个 demo 检查器 | 全部通过 | `demo-checks-final.log` |
| 主站产物检查 | 通过 | `output-check-final.log` |
| `/review/` 组合构建及十八个 demo 检查器 | 全部通过 | `build-prefix.log`、`demo-checks-prefix.log` |
| JS 语法与双语内容结构 | 106 文件语法通过；内容结构通过 | `js-final.log`、`content-final.log` |
| 十五张目录预览与桌面/手机截图 | 1280×960 JPEG 均在 1–300 KiB 内；1440/390px 无横向溢出，已目视复核 | `capture-final.log`、`visuals/` |

证据根目录为 `F:/agents/code/temp/independent-scenes-20261007/`。
其中 `visuals/all-scenes.jpg` 是十五套预览总览；每个案例有独立的桌面、手机对照图，
并保存完整页面截图。`visuals/map-metrics.json` 记录六组手机地图标签的边界和字号。
十五套独立构建的前期检查日志分别在 `creator/`、`retail/`、`dashboard-travel/`；
最终完整组合检查使用上述 `*-final.log`，不要将中间失败日志当作最终状态。

本地使用已有 Hugo 0.157.0、Node 22.13.1、Python 3.13.2 和 Playwright，未安装依赖。
看板和旅行检查器使用标准库 `tomllib`，其 README 明确要求 Python 3.11+。

## 复验命令

从仓库根目录运行。以下路径均为本地证据目录，示例域名不表示已部署。

```powershell
node --test tests/build-site.test.cjs tests/demo-registry.test.cjs tests/check-demo-builds.test.cjs tests/demo-scenes.test.cjs tests/deployed-site-check.test.cjs tests/content-dashboard.test.cjs tests/bookstore.test.cjs tests/workshop-booking.test.cjs tests/trip-planner.test.cjs tests/demo-template-links.test.cjs tests/demo-catalog-links.test.cjs tests/photo-demo-check.test.cjs
node scripts/check-js.cjs
node scripts/check-content.cjs
node scripts/build-site.cjs --destination F:/agents/code/temp/independent-scenes-20261007/public
$env:SITE_ROOT = 'F:/agents/code/temp/independent-scenes-20261007/public'
node scripts/check-demo-builds.cjs
node scripts/check-build-output.cjs
```

在单独终端设置同一个 `SITE_ROOT` 和 `PORT=4177`，运行
`node scripts/serve-public.cjs`。另一个终端运行：

```powershell
$env:E2E_BASE_URL = 'http://127.0.0.1:4177'
$env:E2E_USE_LOCAL_SERVER = 'false'
node node_modules/@playwright/test/cli.js test e2e/content-dashboard.spec.cjs e2e/bookstore.spec.cjs e2e/workshop-booking.spec.cjs e2e/trip-planner.spec.cjs e2e/portfolio-presentation.spec.cjs e2e/demo-templates.spec.cjs e2e/demo-polish.spec.cjs e2e/demos.spec.cjs e2e/photo-feature.spec.cjs --workers=4 --max-failures=5 --output=F:/agents/code/temp/independent-scenes-20261007/final-browser-results
```

子路径验证使用新的终端，避免继承生产检查变量：

```powershell
node scripts/build-site.cjs --destination F:/agents/code/temp/independent-scenes-20261007/prefix-root/review --baseURL https://example.test/review/
$env:SITE_ROOT = 'F:/agents/code/temp/independent-scenes-20261007/prefix-root/review'
$env:SITE_URL = 'https://example.test/review/'
node scripts/check-demo-builds.cjs
```

另用 `SITE_ROOT=F:/agents/code/temp/independent-scenes-20261007/prefix-root`、
`PORT=4178` 启动本地服务，浏览器测试执行：

```powershell
$env:E2E_BASE_URL = 'http://127.0.0.1:4178/review/'
$env:E2E_USE_LOCAL_SERVER = 'false'
node node_modules/@playwright/test/cli.js test e2e/demo-templates.spec.cjs --grep 'templates switch between every pair|scenes embed their own|scenes retain complete work links|retains content and usable template navigation' --workers=2 --max-failures=3 --output=F:/agents/code/temp/independent-scenes-20261007/prefix-browser-results
git diff --check
```

## 后续维护与边界

入口说明见 [demos/README.md](../demos/README.md)，素材制作记录见
[ART_SOURCES.md](../demos/creator-portfolio/docs/ART_SOURCES.md)。场景变更应同时更新对应内容、
数据、配置、文案、预览和相关验证，避免只切样式参数而沿用其他场景的数据。

自动与本地视觉检查不等于客户验收或线上部署验证。演示没有真实交易、预约、定位、
后台或持久化；切换场景、刷新会重置临时操作。获得发布授权后再推送、检查 CI 和线上产物。
