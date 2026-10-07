# 行程编排：三个独立目的地场景

三套独立 Hugo 静态演示，共用行程逻辑，各自拥有品牌、八处原创虚构地点、描述、估算、坐标与地图地形。图面均为本地原创内联 SVG，没有外部底图、字体或图片；没有定位、预约、后台、网络数据接口或持久化。虚构地点与路线不能用于真实出行。

| 场景 / 模板 | 原创内容与地图 | 版式与交互 |
| --- | --- | --- |
| 远山周末 / FARWEEK · `classic` | 松风脊、雾桥溪等山谷停靠点；松绿山脊、溪流与湖泊图 | 地点、地图与行程并排，窄屏顺序阅读 |
| 巷里漫游 / LANE LETTERS · `journal` | 栖钟院、墨线巷、拾页印房等街巷片段；石板蓝街网、院落与河岸图 | 老城明信片、旅行手记与地点便签；累计时间线、可展开地点 / 站点手记 |
| 岬屿慢行 / CAPE DAYS · `workbench` | 白岬灯塔、盐田花圃、小港食堂等离岛停靠点；蓝色群岛与潮线图 | 地图底板、可收起浮动面板、地图地点详情；地图键盘选择与加入行程 |

首页 front matter 管理当前品牌、标题、简介、时期、地图名称与说明；页头、页脚、meta 与说明页始终使用当前场景。三套记录、名称和地图位置分别独立；共用的 `map-pins.html` 只负责从当前 JSON 生成点位，山谷、老城与海岛分别使用 `map-mountain.html`、`map-oldtown.html`、`map-islands.html` 的原创地形。

## 一次选择完整场景

需要 Hugo Extended 0.157.0 与 Python 3.11+；检查器使用标准库 `tomllib`。当前本地验证环境为 Python 3.13.2，无新增依赖。在本目录运行：

```powershell
# 远山周末
hugo server --config hugo.toml
# 巷里漫游
hugo server --config hugo.toml,variants/journal/config.toml
# 岬屿慢行
hugo server --config hugo.toml,variants/workbench/config.toml
```

替代场景配置同时选择 `params.demoTemplate`、`contentDir`、`dataDir`，不能只改外观参数后使用原地点。经典场景保留 `content/` 与 `data/places.json`；其他场景位于 `variants/<template>/content/` 与 `variants/<template>/data/places.json`，JSON basename 一致。

集成地址保持 `/demos/trip-planner/`、`/demos/variants/trip-planner/journal/`、`/demos/variants/trip-planner/workbench/`。集成构建按场景选择内容与数据目录。菜单标为“场景”，说明“不同场景，切换后进入对应首页，临时操作将重置。”；从说明页切换也进入目标首页。独立站未注入目录参数时不显示主站入口。

## 独立构建与核对

```powershell
hugo --config hugo.toml,variants/journal/config.toml --destination 'F:\agents\code\temp\trip-planner-journal' --baseURL 'https://example.github.io/walking/' --minify --panicOnWarning
python -B -X utf8 scripts/check_build.py 'F:\agents\code\temp\trip-planner-journal' --base-url 'https://example.github.io/walking/' --check-demo-pages
```

示例域名只用于检查子路径。检查器验证首页、about、脚本、素材、本地链接、唯一 `main h1` 与演示声明，然后按产物模板标记读取对应源文件，核对源 JSON、内嵌 JSON、八张静态地点卡、费用 / 停留、地图 ID / 标签 / 坐标、地图场景与初始空行程。集成检查可增加精确的 `--catalog-url /demos/` 和各场景首页 `--template-url`。它不会仅取消原来的八处静态地点要求。

## 估算口径与操作

- 地点可按自然、人文、休憩筛选。行程最多六处，每处只加一次；支持上移、下移、移除、清空。筛选保留已选行程，编号与折线跟随清单顺序。
- `durationMinutes` 为正安全整数分钟，`costCents` 为非负安全整数分。相邻两处加 20 分钟交通，与图面距离及顺序无关；一处不加交通。含交通总时间超过 480 分钟提醒减少地点或拆成两天。
- 预算仅相加地点示例费用，再显示人民币金额，不包含清单外交通、住宿与个人消费。总量溢出会停止增强，数据不会悄悄失真。
- 地点的 `id` 是唯一小写英文短名，名称与描述非空，类别限定自然、人文、休憩；坐标 `x`、`y` 是 0—100 范围内的有限数字。数据校验保持严格。
- 地形和坐标全部虚构。山谷与老城的橙线、海岛的蓝线只表示清单先后，**非真实地理导航**，不表示道路、航路、距离、可通行性、潮汐或船班。
- 手记每站累计分钟从零开始，包含前一段 20 分钟交通；不是到达时刻。重排保留已展开手记，移除后清除。地点便签可独立展开，加入按钮始终可用。
- 工作台地图可点击，或用方向键、Home、End 移动焦点后 Enter / 空格查看地点，再加入同一行程。收起面板不清空路线；地图加入展开行程，清空展开地点并恢复筛选焦点。
- Tab 与 Enter / 空格操作按钮；重排后焦点跟随地点，移除后转到邻近地点。关闭 JavaScript 时八处地点与基础地图可读、控件禁用，手记便签全部展开，工作台标记只有基础图形；增强成功才赋予按钮语义。
- 当前状态仅在页面内存中，刷新或切换场景重置；不读 localStorage / sessionStorage。天气、真实路况、开放时间与体力不参与估算。

更新时同步对应场景首页、about、JSON 与地形素材，再运行仓库根目录的 `node --test tests/trip-planner.test.cjs` 和 `e2e/trip-planner.spec.cjs`。测试按每套实际地点核对地图顺序、估算、六处上限、焦点、便签、面板、键盘、320 / 390 / 800 / 1280px、无存储 / 网络与无 JavaScript，并保留经典山谷 315 分钟 / ¥12.00 的固定回归。最终还应逐套截图审查。

虚构演示和自动检查不表示真实客户交付、预订服务或旅游资料授权。
