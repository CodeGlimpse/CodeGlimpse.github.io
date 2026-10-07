# 三间独立材料工坊

本目录可单独复制为一个 Hugo 静态站。三套场景分别拥有自己的品牌、课程、材料说明、示例期间、首页和说明页，每套六门课、十二场固定排期。日期、容量、金额与预览使用同一组核心脚本。页面不加载外部字体、图片、CDN 或远程数据，没有账户、后台或真实预约接口。

| 场景 | 品牌、期间、课程 | 布局与原创本地素材 | 内容、数据目录 |
| --- | --- | --- | --- |
| classic | 拾光工坊，2026 年 10 月：陶艺、印刷、花艺各两门 | 综合材料展架、完整排期、常驻预约面板；六幅 CSS/SVG 手作图示 | `content/`、`data/` |
| calendar | 岸陶工房，2026 年 11 月：手捏、拉坯、施釉各两门 | 月历先选日期、当日独立详情、整月入口；六幅陶器图示与泥料工具插画 | `variants/calendar/content/`、`variants/calendar/data/` |
| agenda | 折页印作社，2026 年 12 月：纸艺、版画、装帧各两门 | 三步课程、场次、人数预览；折痕与对位印记、纸上工作票、六幅纸艺版画图示 | `variants/agenda/content/`、`variants/agenda/data/` |

所有数据都使用 `schedule.json` basename，十八门课程的 ID、书写说明与标题互不复用，三个期间也各不相同。首页 frontmatter 保存品牌、期间、主题色、图标和独立说明文案，页头、页脚、meta、日历和说明页使用当前首页。现有集成 URL 保留：`/demos/workshop-booking/`、`/demos/variants/workshop-booking/calendar/`、`/demos/variants/workshop-booking/agenda/`。

## 独立预览与构建

使用 Hugo 0.157.0、Python 3.10 以上。在本目录成套选择版式、内容与数据：

~~~powershell
hugo server
hugo server --config hugo.toml,variants/calendar/config.toml
hugo server --config hugo.toml,variants/agenda/config.toml
~~~

`hugo.toml` 默认为 classic；两个 variant config 同时设置 `params.demoTemplate`、`contentDir` 与 `dataDir`。陶艺日历的子路径构建示例：

~~~powershell
hugo --config hugo.toml,variants/calendar/config.toml --destination 'F:/agents/code/temp/workshop-calendar-build' --baseURL 'https://example.test/review/workshop-calendar/' --minify --panicOnWarning
python -B -X utf8 scripts/check_build.py 'F:/agents/code/temp/workshop-calendar-build' --base-url 'https://example.test/review/workshop-calendar/' --check-demo-pages
~~~

classic 使用 `--config hugo.toml`；agenda 使用 `--config hugo.toml,variants/agenda/config.toml`，并调整输出路径及 base URL。构建不依赖父仓库主题或脚本，不需要安装额外依赖；示例 URL 不表示已发布。

## 场景菜单

主站通过 `demoTemplate`、`contentDir` 与 `dataDir` 注入当前场景。场景链接总是进入对应首页，提示“不同场景，切换后进入对应首页，临时操作将重置。”。独立模式默认没有主站入口，仅设置 `params.demoCatalogURL` 才显示“← 返回演示目录”。检查器的 `--catalog-url` 与多个 `--template-url` 只允许精确匹配的标记链接使用路径例外。

## 内容、数据与视觉

- 各 `content/` 与 `variants/*/content/`：独立首页和排期说明。
- 各 `data/schedule.json`：当前场景的唯一课程与排期来源；页面和内嵌 JSON 同源。
- `layouts/partials/course-art.html`：十八幅原创 SVG 课程图示。`static/illustrations/`：陶艺工具、纸艺工具与各场景图标，全部在本地。
- `static/css/site.css`：综合手作使用材料白 `#f0eee8`、砖色 `#a05433`、灰绿墨色 `#2f3b40`、次文 `#615f56`、纤维灰 `#cfcbbf`；本机宋体标题配材料展架。
- `static/css/calendar.css`：矿物白 `#e5eceb`、瓷白 `#f7faf8`、青釉 `#235c61`、灰绿 `#506c6d`、坯料灰 `#b2c7c3`；完整星期网格保留课程名与开始时间。
- `static/css/agenda.css`：纸白 `#edf0fa`、印刷蓝 `#294da5`、对位红 `#d9454a`、试印黄 `#f6cd3c`、次文 `#53658d`；真实操作顺序配折页工作票。
- `static/js/booking-core.js`：所有场景共用数据校验、UTC 日期、容量与金额。`booking.js`：筛选、焦点、三步门槛、日历和预约预览。

课程字段为 `id`、`title`、`category`、`description`、`materials`、`level`、`durationMinutes`、`priceCents`、`art`。分类从当前课程推导，ID 必须唯一且安全；文本非空，分类拒绝 HTML、空格边界和保留值 all。价格为非负安全整数分，乘以最多六人仍为安全整数；时长为正整数，art 必须对应支持的本地图示。

场次字段为 `id`、`courseId`、`date`、`start`、`end`、`remaining`。日期属于当前 month，年月与实际日历日期有效；24 小时时段的结束晚于开始，时长与课程一致；余位为 0—6 的整数，每门课程有场次。

## 交互与演示边界

选择课程后选择对应场次。分类或日期改变会清除不再符合条件的场次；换课清除旧场次。每份预览 1—6 人，不超过示例余位。满额不可选择；超额保留当前场次并提示余位不足，停用预览按钮。费用以整数分乘人数计算。

日历使用当前 schedule.month 计算首日、天数与周一开始的网格。电脑日期格展示课程与时间；手机日期格保留日期、场次数和满额提示，选定一天后在详情区查看完整课程与时间，避免小字挤满七列。整月恢复全部数据。Arrow、Home、End 键移动日期焦点，Enter/Space 选择日期，重置返回日期入口。

三步流程依次选择课程、挑选场次、人数与预览；下一步按选择状态启用，上一步保留状态，换课清除旧场次与预览。页面提供可见焦点与简短状态播报，动效尊重 prefers-reduced-motion。

预约预览只在当前页面内存中生成，刷新、离开或切换场景即重置。不收集个人信息，不读写浏览器持久化存储，不提交信息、锁定名额、付款或发送通知。所有课程、价格和余位均为虚构固定示例。

关闭 JavaScript 后六门课程、材料、价格、十二场排期仍可读，日历完整展示当月日期，三步流程全部展开；选课、筛选、人数与预览控件禁用。

## 验证

`scripts/check_build.py --check-demo-pages` 检查页面、资源、子路径、声明及两份 defer 脚本，将六门静态课程和十二场排期的 ID、文案、金额、余位及时间逐项对照内嵌 JSON 和当前场景源文件。

父仓库中 `node --test tests/workshop-booking.test.cjs` 覆盖三套场景、日期、时段、余位、换课、金额、无效数据和场景独立性。`e2e/workshop-booking.spec.cjs` 读取当前 dataDir，覆盖真实日期与月份、满额、超额、金额、三步、日历键盘、320/390/800/1280 像素、无存储与无 JavaScript。单独复制本目录构建时无需这些父仓库测试。
