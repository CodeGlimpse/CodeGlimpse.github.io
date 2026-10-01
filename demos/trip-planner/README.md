# 远山周末｜旅行行程编排演示

这是一个独立 Hugo 静态站，以八个原创虚构地点和原创内联 SVG 地形图演示周末行程编排。站点以深松绿、米黄与橙色路线呈现地图编辑体验；它不包含真实景点、旅行推荐或地理导航资料。

可按自然、人文、休憩筛选地点，加入最多六处且不重复；清单支持上移、下移、移除和清空。地图连线及数字、地点数、停留时间、预算和含交通总时间跟随清单更新。筛选保留已加入的地点。

## 演示口径

- `durationMinutes` 是每处虚构地点的固定停留时间。每一对相邻地点加 20 分钟交通时间，与示意距离和顺序无关。空行程全部为零，一处不加交通；总时间超过 480 分钟（8 小时）时提醒拆分行程。
- `costCents` 为整数分，按地点费用相加再显示金额。费用只是体验或停留的示例预算，未包含清单之外的交通、住宿和个人消费，不能用于真实出行决策。
- 地点、描述、地形和坐标均为原创虚构内容。橙色折线只表示当前先后顺序，**非真实地理导航**，不代表道路或路线距离。
- 没有定位、预约、后端、外部请求或持久化。状态仅存在页面内存中，刷新重置；不访问 localStorage 或 sessionStorage。
- 关闭 JavaScript 时保留八个地点和基础地图，控件初始禁用；初始化成功后才启用编排。移动后焦点跟随同一地点；移除后优先转到下一处或上一处，空清单时转到类型筛选。状态播报使用简短的 `aria-live` 消息。

## 本地预览与独立构建

需要 Hugo Extended 0.157.0、Python 3.10+。在本目录运行：

```powershell
hugo server
```

独立站默认不显示返回博客目录入口。以下命令构建一个项目子路径，`example.github.io` 只是占位示例：

```powershell
hugo --destination "$env:TEMP\trip-planner-build" --baseURL 'https://example.github.io/weekend/' --minify --panicOnWarning
python -B -X utf8 scripts/check_build.py "$env:TEMP\trip-planner-build" --base-url 'https://example.github.io/weekend/' --check-demo-pages
```

集成构建可由父站注入 `HUGO_PARAMS_DEMOCATALOGURL`，例如 `/review/demos/`。只有参数非空时，每页才出现“← 返回演示目录”。它使用参数的精确根相对地址；独立检查时传入同一个 `--catalog-url` 才允许这个标记链接离开当前 demo 的路径前缀：

```powershell
python -B -X utf8 scripts/check_build.py "$env:TEMP\trip-planner-build" --base-url 'https://example.github.io/weekend/' --check-demo-pages --catalog-url '/review/demos/'
```

上一条命令只适用于构建时已注入 `/review/demos/` 的产物。检查器默认要求首页和完整本地链接；`--check-demo-pages` 额外要求每页唯一的 `main h1`、注入时唯一的返回目录入口、about 页面、本站 CSS/两份 JS、原始八处静态地点和地图点位以及演示声明。复制或修改样例后，应同步更新这些样本约束。

## 更新地点与内容

- `data/places.json` 是地点数组：`id` 用唯一小写英文短名；`name` 和 `description` 是展示文字；`category` 只能是自然、人文、休憩。
- `durationMinutes` 使用正整数分钟；`costCents` 使用非负整数分，例如 `1299` 显示为 ¥12.99；`x`、`y` 是 0–100 的示意坐标。所有汇总必须处于 JavaScript 安全整数范围。
- 更新文字、示例费用或位置后重新构建；列表、基础 SVG 点位与 JSON 同时从这份数据生成。地形路径在 `layouts/index.html`，不是外部地图底图。
- `content/about/index.md` 更新口径说明；`hugo.toml` 更新站名和页面描述；`static/css/site.css` 是页面样式。
- `static/js/planner-core.js` 提供 CommonJS 与 `window.TripPlannerCore` 接口；UI 在 `static/js/planner.js`。初始化只读页面中的 HTML 转义 JSON，不使用网络、存储或动态 HTML 拼接。

仓库根目录的 `tests/trip-planner.test.cjs` 和 `e2e/trip-planner.spec.cjs` 分别覆盖核心状态边界、地图顺序、汇总、焦点、手机布局与无 JavaScript 退化。新增地点或调整估算时，人工核对并同步对应预期，再由维护者运行相关测试。

本样本供内部验证。虚构演示和已实现的交互不表示任何真实客户交付、预订服务或旅游数据授权。
