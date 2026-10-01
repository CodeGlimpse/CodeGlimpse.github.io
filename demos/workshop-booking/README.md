# 拾光工坊｜手作课程预约预览

独立 Hugo 静态站，展示六门原创虚构手作课程与 2026 年 10 月的十二个固定示例场次。陶艺、印刷、花艺各有两门课程，每门两场，余位范围为 0–6 人，包含满额场次。陶土橙、奶油纸与深靛蓝构成页面配色，课程封面由原生 SVG 绘制，不使用外部字体、图片、主题或运行时依赖。

可按手作分类和日期筛选，选择课程、场次及 1–6 人，查看课程、日期、时段、人数、单价与合计组成的“预约单预览”。也可直接从完整排期选场次。满额场次不可选；人数超过所选场次的示例余位时保留场次，提示余位不足并禁用预览。课程切换、筛选或人数变更都会清空旧预览；课程或日期变化导致当前场次不适用时，需要重新选场。

这是**虚构演示 · 预约预览**，所有品牌、课程、材料、价格和余位均为虚构示例。余位不是实时库存。页面不收集姓名或电话，没有登录、支付、后台、真实预约、存储或数据请求；不提交信息、不锁定名额。刷新页面重置选择。关闭 JavaScript 后仍展示完整六门课程与十二场排期，控件保持禁用并说明只读状态。

## 两种展示模板

`site.Params.demoTemplate` 未设置时使用 `classic`，保留课程卡片、日期列表与预约预览的原有顺序。设置为 `calendar` 后，页面先显示按周一至周日排列的完整十月日历：日期内列出固定示例课程与场次，先选日期再展开当天的课程和排期，也可选择“查看整月课程与排期”。满额日期仍能查看说明，满额场次继续禁用。说明页沿用日历版的深靛蓝导航与面板外观。其他模板 ID 会触发 `errorf` 构建错误。

日历按钮增强现有 `#date-filter`，课程、场次、人数和金额仍由同一份 `booking.js` 状态与 `booking-core.js` 管理。切换日期会清除原先的课程、场次和预览；人数改变时仍保留所选场次并校验余位。日期按钮支持 Tab、Enter、空格，也支持方向键、Home 和 End 在有排期的日期间移动焦点。重置后回到日期入口，焦点落在仍可见的日期筛选。

两版共用 `workshop-*.html` 内容 partial、六门课程与十二场排期，不复制数据。关闭 JavaScript 后，日历、全部课程、全部场次仍可阅读，日期与预约控件保持禁用。`css/site.css` 始终加载，`static/css/calendar.css` 仅在日历版加载；没有额外的 `calendar.js`、存储或请求。

集成地址为原版 `/demos/workshop-booking/` 与日历版 `/demos/variants/workshop-booking/calendar/`。模板切换入口由集成构建提供，并保持说明页的 `about/` 路由；独立站可用 `[params] demoTemplate = 'calendar'` 或 `HUGO_PARAMS_DEMOTEMPLATE=calendar` 选择外观。

## 独立预览与构建

使用仓库约定的 Hugo 0.157.0。在本目录运行 `hugo server`；或构建到临时目录并检查带前缀的资源与导航：

```powershell
hugo --destination "$env:TEMP\workshop-booking-build" --baseURL 'https://example.github.io/workshop-booking/' --minify --panicOnWarning
python -B -X utf8 scripts/check_build.py "$env:TEMP\workshop-booking-build" --base-url 'https://example.github.io/workshop-booking/' --check-demo-pages
```

示例地址用于检查子路径，不表示已部署。脚本独立检查本 demo 的首页、说明页、本地 CSS/JS、资源导航、唯一主标题、首个跳转链接、完整静态排期与演示声明，不依赖主站输出。`--check-demo-pages` 检查原始演示约束，改造成其他数据结构后可省略该选项，仅检查链接和输出文件。

默认不设置 `demoCatalogURL`，独立站不显示主站返回链接。集成时由外部配置提供 `[params] demoCatalogURL`，页面才显示文字为“← 返回演示目录”的 `a[data-demo-catalog]`。这个链接是唯一有意跨出演示前缀的本地导航；集成检查需传入精确路径，例如 `--catalog-url /demos/`，带站点前缀时应使用实际目录路径。脚本只放行标记链接与传入路径的精确匹配。

## 更新课程与排期

- `content/_index.md`：首页标题和简介。
- `content/about/index.md`：虚构数据边界、操作与隐私说明。
- `data/schedule.json`：唯一课程与场次来源；静态 HTML 和内嵌脚本数据由此共同生成。
- `layouts/partials/course-art.html`：本地 SVG 手作图案；`layouts/` 和 `static/css/site.css`：结构与响应式样式。
- `static/js/booking-core.js`：数据校验、筛选、选择协调和整数分金额计算，支持 CommonJS 与 `window.WorkshopBooking`。
- `static/js/booking.js`：启用静态控件、保留可操作元素的焦点、更新选中状态与页面内预览。

数据结构为 `{ "month": "2026-10", "courses": [...], "sessions": [...] }`：

| 记录 | 字段与约束 |
| --- | --- |
| 课程 | 唯一 `id`；`title`、`description`、`materials`、`level`、`art` 为非空字符串；`category` 为陶艺、印刷或花艺；`priceCents` 为非负安全整数分；`durationMinutes` 为正整数 |
| 场次 | 唯一 `id`；`courseId` 对应课程；`date` 为该月份内有效 `YYYY-MM-DD`；`start`、`end` 为 `HH:mm` 且结束晚于开始，时长匹配课程；`remaining` 为 0–6 的整数 |

更新数据后重新构建即可同步静态课程、排期、日期选项与脚本。日期星期由明确 UTC 日期计算，保持跨时区一致；课程费用按 `priceCents × quantity` 计算，展示时转换为两位小数。扩大分类、月份、人数或余位范围时，应同步模板、核心校验、说明页和对应测试。

模板自动转义课程文字；`application/json` 内嵌数据使用 Hugo `jsonify` 默认 HTML 转义加 `safeJS`，保留对结束脚本等特殊文本的防护。动态文本通过 `textContent` 更新。筛选采用隐藏既有元素的方式保留焦点，不重新创建课程或场次按钮。

## 验证

从仓库根目录运行受影响测试；浏览器验证需要先由主站构建流程输出本 demo：

```powershell
node --test tests/workshop-booking.test.cjs
npx.cmd playwright test e2e/workshop-booking.spec.cjs --workers=1
```

六个 Node 测试覆盖日期与数据、余位、课程归属、整数分金额、人数与非法 ID/筛选协调。五个浏览器测试仅访问 `/demos/workshop-booking/` 与其说明页，覆盖实际选课预览、离线和禁用存储、人数不足与旧摘要清除、键盘焦点、320/390 像素手机和无 JavaScript 的完整只读排期。
