# 维护记录

本文件按时间追加，不删除历史记录。提交或工作流信息应使用可追溯的 SHA 和 Run ID。

## 记录模板

```markdown
## YYYY-MM-DD - 简短标题

- 类型：版本更新 / 主题更新 / 线上故障 / 维护机制
- 影响范围：
- 变更内容：
- 验证命令：
- 验证结果：
- 源代码提交：
- GitHub Actions Run：
- 回滚：无 / <提交 SHA>
- 后续事项：
```

## 初始维护基线

- 类型：维护机制
- 影响范围：本地检查、PR 发布、主题更新和线上监控流程
- 变更内容：建立长期维护手册、发布摘要、完整线上巡检和每周监控
- 验证命令：`npm.cmd run check`、`npm.cmd run test:e2e`、线上 `check:site`
- 验证结果：以本次维护提交和发布工作流结果为准
- 源代码提交：见 Git 历史
- GitHub Actions Run：见仓库 Actions
- 回滚：无
- 后续事项：定期复核版本、主题和线上资源

## 2026-09-05 - Clarity 隐私加固与运行时维护

- 类型：隐私与维护机制
- 影响范围：Clarity 脱敏、统计退出、主题更新工作流和线上站点监控
- 变更内容：整体标记动态指标、输出面板和结果卡片；在浏览器存储不可用时保留当前页面硬退出；将 `create-pull-request` 升级到 Node 24 运行时；线上监控改为每日运行并校验源提交。
- 验证命令：`npm.cmd run check`、`npm.cmd run test:e2e`、`npm.cmd run check:site -- https://blog.codeglimpse.top`
- 验证结果：103/103 单元测试、43/43 浏览器 E2E、Hugo ZH 57 / EN 56 构建、构建产物检查和线上端点/本地资源巡检通过。
- 源代码提交：`511b41efa795a04345f75e7ef1ba59121e0ed7be`
- GitHub Actions Run：本次提交发布后记录对应的 Build、E2E、Deploy 和监控运行。
- 回滚：`d208407d812fb1ebdcca3ddc4a3f65506febd689`
- 后续事项：继续评估 Policy B 的地区化同意策略，并定期复核第三方统计请求边界。

## 2026-08-25 - 产品扩展 P0/P1

- 类型：产品功能
- 影响范围：工具注册表、工具索引、双语工具页面、单元测试和浏览器 E2E
- 变更内容：加入分类、关键词和相关工具元数据；加入工具中心筛选、收藏、最近使用、统一下载和偏好接口；新增 Diff、XML、YAML/JSON、Markdown、SQL、JSONPath 六个双语工具。
- 验证命令：npm.cmd run check、npm.cmd run test:e2e
- 验证结果：22 个工具、44 个双语工具页面；新增工具核心测试和产品交互 E2E 全部通过。
- 源代码提交：`b62bcfe7ef40c37e5f6452fbc445c701302e40b9`
- GitHub Actions Run：`32877834684`（Build、E2E、Deploy、线上 Smoke Test 全部成功）
- 回滚：无
- 后续事项：评估 P2 的分享链接、导出增强和离线能力

## 2026-08-26：P2 分享、导出和离线能力

- 变更内容：为 22 个双语工具加入用户触发的 URL 片段分享、JSON 快照导出、在线/离线状态提示，以及版本化 Service Worker 和离线回退页。
- 隐私边界：分享链接只编码用户主动选择的可编辑控件；分享前提示 URL 会包含输入。导出快照仅在本地下载，不上传内容。
- 离线策略：同源导航使用网络优先，静态资源使用缓存优先；缓存版本更新时自动清理旧缓存；不缓存跨域请求。
- 验证命令：npm.cmd run check、npm.cmd run test:e2e
- 验证结果：85/85 单元测试、31/31 浏览器 E2E、Hugo 构建（ZH 56 / EN 55 页）和构建产物检查全部通过。
- 源代码提交：见本次提交历史
- GitHub Actions Run：由本次推送触发，见仓库 Actions

## 2026-08-26：P0-P3 维护与产品扩展

- 类型：维护机制 / 产品功能
- 影响范围：发布文档、线上巡检、分享隐私、Service Worker、PWA 安装、移动端体验和本地预设接口
- 变更内容：修正 22 个工具和 44 个双语页面的维护基线；线上巡检增加 Toast、PWA 和离线资源；JWT 与密码工具默认禁用 URL 分享；增加真实 Service Worker 离线回退 E2E；增加减少动画和移动端分享面板检查；加入 PWA manifest、安装提示和仅使用 localStorage 的预设工作区 API。
- 验证命令：`npm.cmd run check`、`npm.cmd run test:e2e`、线上 `npm.cmd run check:site -- https://blog.codeglimpse.top`
- 验证结果：`npm.cmd run check`（88/88 单元测试、Hugo ZH 56 / EN 55、构建产物检查通过）、`npm.cmd run test:e2e`（34/34）和线上 `npm.cmd run check:site -- https://blog.codeglimpse.top`（62 个端点、115 个本地资源）全部通过。首次发布 Smoke Test 因 Pages CDN 传播超过 60 秒短暂失败，延长等待窗口后复核通过。
- 源代码提交：功能实现 `5be8766983de3389dda6dcfb89815f334e2e92ac`；发布巡检修复 `835a38daa0ce3f02e9ddcf08b21c9d867ef3a432`；发布记录同步 `cda476a5d37e739d23efba58bf73fcf0e28813f8`、`b64f6c81bc769f99229b620faf675e9da328615f`
- GitHub Actions Run：`32931547170`、`32931739998`、`32931917652`（Build、E2E、Deploy、线上 Smoke Test 全部成功；前一 Run `32931156895` 曾受传播时序影响失败）
- 回滚：无
- 后续事项：根据线上安装率和真实离线反馈，评估是否扩展预设 UI 与批量工作流。

## 2026-08-26：移除工具 PWA 安装能力

- 类型：产品定位 / 隐私与维护简化
- 影响范围：安装提示、Manifest、应用图标、相关样式、发布检查和离线文档
- 变更内容：因站点定位为博客，移除工具版 PWA 安装入口、Manifest、应用图标和安装脚本；保留 Service Worker、离线回退页和本地资源缓存，不上传用户内容。
- 验证命令：`npm.cmd run check`、`npm.cmd run test:e2e`
- 验证结果：`npm.cmd run check`（88/88 单元测试、Hugo ZH 56 / EN 55、构建产物检查通过）和 `npm.cmd run test:e2e`（35/35，包含不可安装能力及离线回退检查）全部通过；构建产物不再包含 Manifest、应用图标和 PWA 安装脚本。
- 源代码提交：`4297e23`（`feat: remove tools app installation support`）
- GitHub Actions Run：待获得发布授权后补充
- 回滚：恢复删除前提交 `7c8d7fad7171b77fa7409733e00add0fb2debc26`
- 后续事项：如未来需要安装能力，应设计博客专用 PWA，而不是恢复工具版安装配置。

## 2026-09-06 - 转换语义、分享与离线边界修复

- 类型：缺陷修复 / 项目复核
- 影响范围：SQL、YAML/JSON、XML、共享状态、隐私提示、Service Worker、双语说明及维护文档。
- 变更内容：修复 SQL 参数与注释边界；引入精确锁定且本地打包的 `yaml@2.9.0`、`@xmldom/xmldom@0.9.12`，保留转换数据与 XML 文本；分享/快照记录 CSV、YAML 方向并兼容旧链接；修复存储属性读取失败导致的隐私按钮异常；Service Worker 升至 v4，只缓存成功响应，5xx 回退、等待写入并只清理本站旧缓存；固定 URL 的搜索索引优先联网更新，指纹脚本和样式复用缓存；监控文档同步为每日。
- 收尾验证日期：2026-09-07；完整验收源码为 `1d66de8`，后续文档提交沿用相同运行代码。
- 验证命令：逐项执行 `npm.cmd run check` 的检查链，Hugo 构建与输出检查隔离在 `F:/agents/code/temp/codeglimpse-handoff-20260907-01a079a5/public`；同级 `check-output.cjs` 读取仓库检查器并校验当前完整 HEAD；`npm.cmd run test:e2e -- --workers 2 --output F:/agents/code/temp/codeglimpse-handoff-20260907-01a079a5/e2e`，设置 `SITE_ROOT` 为该隔离产物并使用本地回环服务。
- 验证结果：129/129 单元测试、54/54 Chromium E2E（含移动视口、真实 503、离线解析和搜索索引更新）、53 个 JS 语法、双语内容、工作流、工具链、对比度及 Hugo ZH 57 / EN 56 构建检查通过。检查脚本在 Windows 上跳过 `bash -n`，分发 `.sh` 的该项检查仍需 Ubuntu CI。
- 依赖审计：原任务执行 `npm.cmd audit --omit=dev --json --registry=https://registry.npmjs.org --fetch-retries=0 --fetch-timeout=20000`，报告 0 项已知生产依赖漏洞；本次接替未重新联网审计，也未审计开发依赖。
- 源代码提交：`099c398`、`e57ed61`、`31c112b`、`c119ad5`、`894fa32`、`0267df6`；文档提交见本条 Git 历史。
- GitHub Actions Run：[34079013482](https://github.com/CodeGlimpse/CodeGlimpse.github.io/actions/runs/34079013482)，源提交 `f8997862e38b805065d9a77b4f8f4edb05845140`；Build、E2E、Deploy、线上 Smoke Test 全部通过。独立线上复核通过 68 个端点和 141 个资源，Ubuntu 分发脚本检查通过。
- 回滚：本轮开始前的 `46b1a27ea74e5a6cb424b274256632bedfd4760d`。
- 后续事项：发布后核对源提交与线上资源；单独验证真实统计 SDK 及后台脱敏设置；按 [项目复核建议](project-review-2026-09-06.md) 优先复核已有教程、补作者介绍与系列导航。

## 2026-09-07 - 教程复核与双语阅读导航

- 影响范围：五篇教程的中英文版本、关于及系列页面、前后篇导航、资料复核标记、相关工具和 RSS。
- 变更内容：按官方资料纠正 OpenClaw、Python 和 Fail2ban 内容；保留原文章地址；补作者和系列入口；首页 RSS 从普通页面集合改为文章集合；线上检查增加新入口与 RSS。
- 验证：130/130 Node 单测、61/61 Chromium E2E；独立 Hugo ZH 60 / EN 59 构建及产物检查通过；桌面与手机暗色排版已查看。
- 内容验证边界：官方资料复核与实机验证分别标注，本轮未安装或卸载教程软件、未操作真实登录浏览器、未修改 Linux 服务。
- 资料、验证命令及后续四次选题见 [内容维护记录](content-maintenance-2026-09-07.md)。源代码与发布记录可按本条 Git 历史在 [部署工作流](https://github.com/CodeGlimpse/CodeGlimpse.github.io/actions/workflows/deploy.yml) 查询。
- 发布：源提交 `3e2085d042df864e414201cec0210cf2433e65e4`，对应 [Actions Run 34084725573](https://github.com/CodeGlimpse/CodeGlimpse.github.io/actions/runs/34084725573)；Build、E2E、Deploy 成功，独立线上 76 个端点/147 个资源及 12 项浏览器抽查通过。
- 游戏栏目：仅形成[可行方案](games-column-proposal-2026-09-07.md)，未实现游戏或修改对应运行能力。
- 回退基线：本轮前已发布的 `f8997862e38b805065d9a77b4f8f4edb05845140`。

## 2026-09-07 - 清理公开审查文案并精简阅读入口

- 用户决定：审查过程仅保留在维护文档；取消独立系列入口，保留 OpenClaw 文章内的顺序和前后篇导航。
- 变更：十份文章的审查日期和范围迁至 `docs/tutorial-review-records.json`；删除公开提示组件、样式和正文审查叙述；关于页改用分类入口；既有系列地址保持兼容。
- 验证：内容、脚本、JavaScript 检查及独立 Hugo 构建通过；构建检查扫描 HTML、JSON、XML，拦截内审标记；9/9 定向浏览器测试通过，覆盖双语正文、搜索、RSS、导航和维护记录的 404 响应。
- 发布验证沿用现有 Actions 门禁，结果按本条对应源码提交查询；不新增依赖。
- 回退基线：`21f337eb60dca04b783139bb806890ee09ff9513`。

## 2026-09-07 - 页内小游戏栏目

- 用户要求：小游戏直接运行在页面中，不使用 iframe，不需要存档。
- 实现：双语游戏目录和记忆翻牌、贪吃蛇、2048；纯 JavaScript/Canvas、按需加载、局部输入、自动暂停、重开与刷新重置；新增游戏图标和独立样式。
- 验证：145/145 单元测试、77/77 Chromium E2E；61 个 JS 文件、内容、工作流、版本、分发脚本及对比度检查通过；Hugo ZH 64 / EN 63 构建与产物检查通过。桌面和手机暗色截图已查看。
- 约束：游戏代码不使用持久化浏览器存储；没有新增 npm 依赖、第三方游戏或媒体资源；审查信息不放入公开页面。
- 维护与扩展见 [games.md](games.md)。发布继续沿用 Actions、源提交和线上资源验收。
- 回退基线：`376a6539e325e84bbb4bfc418912f3cdcf8feba9`。

## 2026-09-07 - 新增七款页内小游戏

- 用户要求：把建议中的七款全部加入，延续直接在页面运行、无存档的约束。
- 实现：新增扫雷、打砖块、打地鼠、关灯游戏、数字滑块、点按飞行、本地双人四子棋，合计十款游戏、二十个双语游戏页面；提供独立封面、键盘和触屏操作、暂停与重开。
- 结构：棋盘拆为按 ID 选择的 partial；通用控制补充网格焦点、暂停快捷键与动画循环。修复数字滑块在点按后因格子变为空位而丢失键盘焦点的问题；结束后展示最终棋盘。
- 验证：172/172 单元测试、100/100 Chromium E2E，其中 37 项覆盖游戏；75 个 JS 文件及版本、工作流、内容、分发脚本、对比度检查通过；Hugo ZH 71 / EN 70 构建与产物检查通过。
- 外观核对：已查看三款游戏的现有测试截图，十款均通过手机布局与深色说明文字检查。创建额外截图脚本和直接打开预览页被自动审批接口 404 错误阻止，未完成全套额外外观抽查。
- 资源：没有新增依赖或第三方图片、音频。新增单款 minified JS 为 5,597–9,686 B；仅在点击开始后加载。维护文档、README、贡献指南及方案同步更新；内部验证记录不进入网站内容。
- 发布：沿用对应源码提交的 [部署工作流](https://github.com/CodeGlimpse/CodeGlimpse.github.io/actions/workflows/deploy.yml)，线上检查扩展至 98 个端点。
- 回退基线：`5b732e5e2acd97aba0f90749b870a677ba2901da`。
- 收尾补充：审批恢复后已逐款查看七款新增游戏的 375×812 手机深色画面，并核对桌面目录；此前受阻的外观核对已完成。
- 发布结果：功能提交 `1899523da28406b92ee8add772bd5a31f445493c`，对应 [Actions Run 34121942712](https://github.com/CodeGlimpse/CodeGlimpse.github.io/actions/runs/34121942712) 成功；独立线上巡检通过 98 个端点、183 个引用资源，37/37 游戏浏览器测试一次通过。后续提交仅同步这份完成记录与维护文档。

## 2026-09-08 - 游戏目录搜索与六款新游戏

- 用户要求：增加游戏搜索框，并确认新增方块堆叠、推箱子、井字棋（对电脑）、迷你数独、反应测试、记忆序列，栏目达到十六款。
- 搜索：双语名称、说明、标签和关键词在当前页面即时筛选；支持全角、大小写、多个关键词、IME、结果计数、清空和空结果。没有 JavaScript 时仍展示全部卡片，目录不加载游戏引擎。
- 游戏：新增六个纯规则模块、六个控制器、十二个中英文页面及独立封面和棋盘。推箱子六关可解，数独题目有唯一解；计时、演示和电脑落子可暂停，重开与销毁清理旧任务。没有增加依赖、存档、账号、后台或 iframe。
- 验证：204/204 单元测试、123/123 Chromium E2E，其中 60 项覆盖游戏和目录搜索；89 个 JS、版本、工作流、内容、分发脚本及对比度检查通过；Hugo ZH 77 / EN 76 构建与产物检查通过。
- 外观：核对桌面和手机深色搜索结果，逐款查看六款新游戏的 375×812 手机画面。既有阅读、RSS、隐私、工具和离线测试继续通过。
- 资源：搜索脚本 minified 1,909 B，本地 gzip 957 B；新游戏模块为 6,337–8,361 B，游戏样式 gzip 5,516 B。线上巡检按注册表扩展至 110 个端点。
- 发布：使用本节所在提交的 [部署工作流](https://github.com/CodeGlimpse/CodeGlimpse.github.io/actions/workflows/deploy.yml) 校验源提交与线上资源；日志位于工作区临时目录，前缀为 `catalog-expansion-`。
- 回退基线：`b1a2b5c8a7e7b647a743fdcc0842cb7e970b10c1`。

## 2026-09-08 - 修正反应测试的输入计时边界

- 问题：原先在 `click` 中结算，鼠标和空格键松开前的按住时间会被计入；信号计时也早于下一次画面绘制。
- 复现：固定在绿色状态后 230ms 按下、80ms 后松开，原版显示 310ms，且按下时尚无成绩。保留复现日志 `reaction-timing-reproduced.log`。
- 修复：鼠标/触屏按下、键盘按下时立即记录，采用输入事件自身时间戳；绿色信号与起点在同一动画帧更新，关闭信号过渡动画。过滤松开后的兼容 click、连发、非主按钮和第二触点，同时保留虚拟激活。
- 边界：排队到绿色出现后才送达的早先输入仍算抢跑；暂停、重开和销毁会清理等待定时器及待显示帧。公开说明更新为按下即记录，内部复现记录只放在维护文档。
- 验证：相同固定输入修复后记录 230ms，松开后不变；8/8 定向浏览器测试、206/206 单元测试、130/130 全站 Chromium E2E 通过。内容、89 个 JS、版本、工作流、分发脚本、对比度、Hugo 构建与产物检查通过。
- 发布：沿用本节对应提交的部署工作流及源提交巡检；无依赖升级，仍无存档。
- 回退基线：`63b45724bf2fcd2f20ed12ef1049697648f9a74e`。

## 2026-09-08 - 栏目搜索、手机入口与工具体验

- 范围：完成用户确认的第一批、同批修复和第二批；旧搜索地址直接删除，不增加首页卡片或文章顶部的更新日期。
- 导航：文章搜索进入双语 archives 页面；工具、游戏各自搜索，统一全角、多词、输入法、清空与空结果行为。手机首页新增固定的文章、工具、游戏底栏并压缩顶部区域。
- 工具：JSON 排版保留数值字面量，修复长整数、小数和指数被改写；工具增加专注模式并保留输入，修正 MD5/SHA 文案及中文反馈。
- 阅读与游戏：增加段落链接复制，去重系列与相关文章；游戏目录增加玩法筛选和只在筛选结果中随机选择。
- 内容：关于与联系方式同步，Clarity 后台维护事项移入内部文档；新增内容仅整理到独立候选清单，尚未实现或公开发布。
- 收尾：外观检查发现标题使用 Page.Scratch 共享状态，改为显式模板参数；禁用存储的回归暴露主题直接访问 localStorage，补上初始化与保存回退。
- 验证：209/209 单元测试，146/146 Chromium E2E；92 个 JavaScript 语法检查、版本、工作流、内容、分发脚本和对比度检查通过；Hugo ZH 76 / EN 75 与产物检查通过。手机 320/390 宽度、深色、键盘、无 JavaScript、无存储与离线场景均有覆盖。
- 验证命令：`npm.cmd test`、`npm.cmd run test:e2e`、各项 `check:*`、`npm.cmd run build -- --destination <任务临时目录>/public`；隔离目录通过 `SITE_ROOT` 交给产物检查和浏览器测试。
- 发布：使用本节所在提交的部署工作流，线上巡检包含 116 个端点，其中四个旧搜索地址必须为 404。完整测试日志位于工作区 `temp/codeglimpse-site-usability-20260908/verified-e2e.log`。
- 回退基线：`6f35f7c6c9c61c3d9974b74b40ca68f42c0a168f`；实施前本地检查点为 `dffec22`。

## 2026-09-08 - 补齐博客搜索页的摘要元数据

- 首次发布 `17e16c9` 的线上巡检发现两个 archives 页面缺少 meta description，其余地址与资源检查通过，四个旧搜索地址为 404。
- 补充中英文页面摘要，并将非空摘要验证加入构建产物检查和对应的浏览器用例，避免只在线上才发现。

## 2026-09-09 - A 批三篇实战文章

- 新增 Python 环境错位、OpenClaw 分层排障、反应测试计时原理三篇双语文章，共六个页面和两张 SVG 时序图。
- Python 使用两个隔离虚拟环境和本地 wheel 复现导入失败及修复；OpenClaw 仅验证 2026.9.2 启动器在 Node 22.13.1 下的版本拦截，未进行全局安装或调用模型。
- OpenClaw 文章内顺序扩展为安装、浏览器、排障、卸载；搜索与 RSS 覆盖八篇双语文章，不增加侧栏系列入口。
- 验证：内容与产物检查通过，Hugo ZH 83 / EN 82；相关 32 项浏览器场景通过，其中文章数量更新后定向重跑了三个断言。
- 复现原始记录在工作区 temp/codeglimpse-abcd-20260908，维护依据只记录在 docs/tutorial-review-records.json；线上巡检新增六个文章端点。

## 2026-09-10 - B 批二维码与图片工具

- 新增两款双语本地工具，总数 24；二维码支持 UTF-8、四种纠错等级、PNG 下载和单码图片识别，图片工具支持等比缩小、JPEG/WebP、质量和透明背景处理。
- 依赖固定 qrcode-generator 2.0.4 / jsQR 1.4.0，以 MIT / Apache-2.0 许可随站分发；安装禁用脚本，npm audit 未发现漏洞。
- 图片限制、任务取消、6 秒超时、迟到结果失效和资源释放已实现；不提供图片输入的 URL 分享或 JSON 快照，工具区域屏蔽 Clarity。
- 验证：215/215 单元测试，79/79 工具与体验浏览器回归；100 个 JS 语法、内容与构建产物检查通过，Hugo ZH 85 / EN 84。浏览器验证包括二维码 PNG 回读、EXIF 旋转、透明 WebP、JPEG 背景、离线与窄屏。
- 线上巡检会解析 data-tool-worker，把二维码处理组件纳入同源资源检查。相关日志位于 temp/codeglimpse-abcd-20260908，前缀 b-。

## 2026-09-10 - 适配二维码工作线程资源巡检

- B 批构建与浏览器检查通过，线上规则仍要求主页面重复加载 qrcode-core，导致两处误报。
- 注册表显式标记 Worker，巡检严格要求同源、内容指纹化的 qrcode-worker，并继续检查主脚本与公共资源；新增回归覆盖外部 Worker 拒绝。
- 修正规则已对 B 批正式站验证：126 个端点和 234 个引用资源通过。

## 2026-09-10 - C 批三款小游戏

- 新增舒尔特方格、连连看、双人五子棋，游戏达到 19 款、38 个双语页面，仍直接在页面运行且不持久保存单局。
- 舒尔特方格按序点选 25 个数字，记录误点与暂停外的时间；连连看使用带外围的两次转弯寻路，提示、手动重排与无可用配对自动重排；五子棋采用自由规则并支持点选确认、手机方向微调、键盘、胜线与平局。
- 纯规则测试覆盖四方向五子、跨行边界、长连、满盘平局，以及 80 组连连看棋盘的完整可玩过程与路径验证。
- 验证：225/225 单元测试，97 项相关浏览器场景通过（补齐既有手机测试映射后定向复验）；106 个 JS、内容与构建产物检查通过，Hugo ZH 88 / EN 87。新游戏通关、无存储、暂停重开、320 像素触屏与深色说明均已验证。
- 日志位于 temp/codeglimpse-abcd-20260908，前缀 c-。

## 2026-09-10 - D 批页面反馈与 ABCD 完成

- 在工具、游戏详情页加入 GitHub 和邮件问题反馈入口，使用静态页面标题与规范 URL，不携带实时查询参数、片段、工具输入或游戏状态。
- 增加双语 GitHub Issue 模板；仓库 Issues 已启用、默认分支 master。开发过程没有发送邮件或提交 Issue。
- 最终本地验证：225 项单元测试、174 项整站 Chromium E2E 通过，包含反馈数据边界、手机控件、三个新游戏和两个新工具；内容、工作流与产物检查通过。
- 四批合计新增三篇双语文章、两款双语工具、三款双语游戏和反馈入口，现有 8 篇文章、24 个工具、19 款游戏。
- 发布期间曾遇到 GitHub Pages 平台自身构建失败；重试既有 Pages 构建后恢复，未修改域名或发布源配置。
- 完整日志位于 temp/codeglimpse-abcd-20260908/abcd-final-e2e.log。

## 2026-09-30 - Demo 可靠性第一批修复

- 摄影首页与列表图片明确使用自动高度，避免 HTML 高度属性覆盖响应式裁切比例；浏览器回归覆盖 390、800、1280 像素的首页主图、首页卡片和作品列表。
- 主构建读取 Hugo 合并配置，两个 demo 跟随实际输出目录与基础地址。实际验收发现 Hugo 环境变量优先于 CLI，因此每个子站显式设置自己的 `HUGO_PUBLISHDIR` 与 `HUGO_BASEURL`，避免父配置导致子站覆盖主站产物。
- 主 CI 改用摄影自己的检查器并启用 `--check-demo-pages`；客户独立仓库继续使用通用检查，可以替换演示声明及固定作品。两种模式均检查响应式图片候选地址。
- 发布后资源巡检枚举 `img` 与 `source` 的 `srcset`，保留 URL 内部逗号，忽略外部及内嵌数据地址，并新增对应回归。
- 验证：29 项定向 Node.js 测试、6 项 demo Chromium 测试通过；工作流检查、默认基础地址的整站产物检查及两个 demo 的链接检查通过。命令行与环境变量两种自定义子路径各完成真实组合构建，每组验证主博客保留、目录链接及 13 个 demo HTML 页面引用的 37 个同源资源。
- 构建与浏览器日志保存在 `F:/agents/code/temp/demo-fixes-20260930-01/`。本批仅在本地验收，远程 CI 与线上发布未执行。

## 2026-09-30 - Demo 目录预览与统一注册

- 目录卡片改用两个演示站的真实首页截图，补充双语功能标签；截图为 1280×960 JPEG，创作者作品集 86,636 B、摄影作品集 127,967 B。新增 `npm.cmd run demos:previews`，从本地服务更新截图并等待字体、可见图片加载。
- 两个演示站的所有页面新增“返回演示目录”入口，支持键盘操作及部署子路径；组合构建注入目录参数，独立构建不显示博客返回入口。Python 检查器只放行精确匹配且带标记的目录链接，其余图片、链接及目录越界检查保持有效。
- `data/demos.json` 统一维护双语目录、预览、构建路径与验收要求；主构建、产物检查、发布后巡检、浏览器测试及 CI 的独立 demo 检查均读取注册表。新增 demo 的接入和截图更新步骤同步至 `demos/README.md`，没有新增依赖。
- 验证：52 项定向 Node.js 测试、8 项 demo Chromium E2E 通过；截图脚本语法、工作流配置、整站产物和两个 demo 的链接图片检查通过。默认生产基础地址、环境变量配置的 `/review/` 子路径组合构建，以及两个 `https://example.test/portfolio/` 独立构建均实际验收；前缀页面返回地址正确，独立页面不含博客返回入口。更新后的 CI Python 检查正文已对本地产物执行通过。
- 验证命令：`node --test tests/build-site.test.cjs tests/demo-registry.test.cjs tests/deployed-site-check.test.cjs tests/photo-demo-check.test.cjs tests/demo-catalog-links.test.cjs`；浏览器仅运行 `e2e/demos.spec.cjs`；组合构建使用 `node scripts/build-site.cjs --destination <隔离目录>`，产物由 `scripts/check-build-output.cjs` 与两个 demo 的 `scripts/check_build.py` 检查。
- 构建、浏览器日志及桌面/手机目录截图保存在 `F:/agents/code/temp/demo-catalog-20260930-01/`，包括 `build-final.log`、`build-prefix.log`、`standalone-*.log` 和 `e2e.log`。回退检查点为 `5517a38d7d6150d6c8060b7f98c8b7c8774152e6`；本批仅完成本地验收，未推送、未运行远程 CI、未部署。

## 2026-10-01 - 内容运营看板演示

- 新增“观数 / FIELDNOTES”内容运营看板与数据说明页，演示栏目达到三个站点。24 条原创虚构记录覆盖 2026 年第三季度，支持月份、渠道、标题关键词组合筛选，以及阅读次数、互动次数、互动率和日期的双向排序。
- 汇总指标、渠道条形图和表格使用同一筛选结果；互动率按总互动除以总阅读计算，零阅读显示零。排序保留相同数值的原顺序，搜索支持多关键词、全角规范化和输入法组合输入。没有新增依赖、后台、外部数据请求或浏览器存储。
- Hugo 直接输出完整指标、图表和明细，JavaScript 只增强交互；关闭脚本时仍可阅读全部内容。手机端把数据行显示为带字段标签的卡片，动态生成的元素沿用静态模板样式。集成构建保留返回目录入口，独立构建不带博客返回链接。
- 接入统一注册表、双语目录、构建与现有巡检；新增独立 Python 检查器与目录链接边界回归。真实预览图为 1280×960 JPEG，96,135 B；桌面目录和 390px 手机筛选画面已人工查看。
- 验证：66 项定向 Node.js 测试通过；15 项相关 Chromium 场景通过，其中首次运行 14 项通过，无脚本提示用例因直接读取 `noscript` 得到空文本而失败。页面快照确认提示存在，获用户授权后改为检查实际可见的 `.noscript-note` 段落，定向复验通过。覆盖组合筛选、图表数值、升降序、空结果、零阅读、无存储、离线筛选、无脚本以及 320/390/800/1280 像素布局。
- 构建与产物：默认基础地址的整站构建和产物检查、三个 demo 的独立链接检查通过；环境变量指定 `/review/` 的组合构建验证了全部 15 个 demo 页面、资源、双语目录及返回地址。新看板另以 `https://example.test/portfolio/` 独立构建并检查通过。首次构建因新 Hugo 缓存目录的沙箱权限被阻止，获准重跑同一离线构建后成功；未更改系统配置。
- 主要命令：`node --test tests/build-site.test.cjs tests/demo-registry.test.cjs tests/deployed-site-check.test.cjs tests/photo-demo-check.test.cjs tests/demo-catalog-links.test.cjs tests/content-dashboard.test.cjs`；`node scripts/run-e2e.cjs e2e/demos.spec.cjs e2e/content-dashboard.spec.cjs --workers 2`；无脚本复验使用 `--grep 'without JavaScript'`。同时通过新增脚本语法、内容结构及 `git diff --check` 检查。
- 本地证据位于 `F:/agents/code/temp/content-dashboard-20261001-01/`：`unit-tests.log`、`e2e.log`、`e2e-noscript.log`、`build-final.log`、`build-prefix.log`、`build-standalone.log`、`scope-checks.log` 及桌面/手机截图。回退检查点为 `c5528ee`；本批未推送、未执行远程 CI、未部署。

## 2026-10-01 - 书店、工坊与旅行交互演示

- 新增“纸间书店”“拾光工坊”“远山周末”，演示目录扩至六个独立 Hugo 站点，双语介绍、构建、巡检和返回目录入口均接入统一注册表。
- 书店包含十二本原创虚构图书，支持分类、多关键词搜索、输入法组合输入、购物袋增减、库存限制和整数分合计；工坊包含六门课程与十二个固定场次，支持分类、日期、参与人数、余位判断及预约单预览，变更选择立即清空旧预览；旅行包含八个虚构地点，支持最多六站的添加、排序、移除、地图同步、交通时间与预算汇总，以及超过八小时提示。
- 使用本地 CSS 书封与原创 SVG 手作插画、地形示意，没有新增依赖、远程图片、地图服务、账户、后台或浏览器存储。购物袋与预约预览不会产生真实订单或预约；行程不提供真实导航。三站均保留完整无脚本只读内容，并覆盖键盘焦点与窄屏布局。
- 真实首页预览图为 1280×960 JPEG：书店 95,289 B、工坊 98,667 B、旅行 114,371 B；原有三张预览保持不变。六卡片目录、三款手机交互状态与旅行桌面路线已人工查看。
- 验证：96 项定向 Node.js 测试通过（18 项业务核心、49 项目录检查器、29 项共享构建/注册/巡检）；27 项相关 Chromium E2E 全部通过。初次目录回归 45/48 通过，工坊通用检查误要求固定文案，且错误提示与公共断言不一致；获授权后将文案约束限制到演示模式、统一提示并新增演示模式回归，49/49 复验通过。旅行检查器在首次回归前同步通用/演示模式边界。
- 默认基础地址的组合构建、整站产物、全部六个 demo 独立检查器、内容结构及十二个新增 JS/测试文件语法检查通过。环境变量指定 `/review/` 的真实组合构建验证了双语目录、21 个 demo HTML 页面、22 个声明资源与主站保留；三款新站以 `https://example.test/portfolio/` 独立构建并验收，独立页面无博客返回入口。Hugo 缓存和资源仅通过进程环境变量写入工作区临时目录，未改变系统配置。
- 主要命令：`node --test tests/bookstore.test.cjs tests/workshop-booking.test.cjs`；`node --test tests/trip-planner.test.cjs`；`node --test tests/demo-catalog-links.test.cjs`；`node --test tests/build-site.test.cjs tests/demo-registry.test.cjs tests/deployed-site-check.test.cjs`；`node scripts/run-e2e.cjs e2e/demos.spec.cjs e2e/bookstore.spec.cjs e2e/workshop-booking.spec.cjs e2e/trip-planner.spec.cjs --workers 2 --max-failures 1`。构建、截图与 Python 检查方式见 `demos/README.md` 和各站 README。
- 证据位于 `F:/agents/code/temp/demo-expansion-20261001-01/`，包含单元测试日志、`checker-tests-fixed.log`、`e2e.log`、`output-check.log`、`prefix-check.log`、`build-final.log`、`build-prefix.log`、`standalone-*.log` 及桌面/手机截图。回退检查点为 `1e61c3e`；本批仅本地验收与提交，未推送、未运行远程 CI、未部署。

## 2026-10-01 - 同内容多模板展示

- 六个现有案例各新增一套表现模板，共十二个版本：创作者杂志编排、摄影暗色画廊、内容工作台、书目目录、工坊日历排期与旅行行程手记。作品、图片原件、Markdown、JSON 数据和业务核心共用原始来源；数据与内容源文件未修改。
- 注册表按案例组织 `templates`，构建、截图和巡检消费统一展开后的实例。经典模板保留原有地址，新模板使用 `demos/variants/<case>/<template>/`，校验拒绝重复或互为父子的输出目录。构建显式隔离模板及切换链接环境变量，避免父进程参数污染子站。
- 双语目录按案例成组展示两套真实预览；各页新增同内容模板切换，保留当前详情路由和部署前缀，并提示切换会重置临时操作。独立构建默认 `classic`，可通过 `HUGO_PARAMS_DEMOTEMPLATE` 选择新版，未配置集成参数时不出现博客返回或切换入口。
- 工坊日历使用原有场次与日期筛选状态，支持键盘选日、当天课程、全月查看与预览清理；行程手记按排序显示累计停留和交通分钟。各模板保留无脚本内容和原有业务能力，没有新增依赖、外部素材、存储或后台。
- 六个独立 Python 检查器增加可重复的精确 `--template-url` 白名单，只允许标记的模板锚链接，不放行图片、未标记链接、源属性或路径穿越。CI 改为调用 `scripts/check-demo-builds.cjs`，运行前确认所有模板切换目标实际存在。
- 验证：167 项定向 Node.js 测试、133 项相关 Chromium E2E 通过；另有 14 项 `/review/` 前缀下的真实浏览器双向切换通过。覆盖四个交互案例完整 JSON 一致、两组作品详情及原图内容一致、经典功能、日历、时间线、320/390/1280 像素布局、无脚本、首两次 Tab 顺序及详情路由保留。
- 默认和 `/review/` 两组组合构建、各组全部十二个模板的 42 个 HTML 页面链接检查、十二次独立模板构建均通过。整站产物、双语分组目录、内容结构、工作流权限检查和 17 个变更/新增 JS 脚本语法检查通过。最后的临时前缀目录计数曾因 `demo-card` 正则同时匹配子元素而误报 66，获授权后限定实际卡片锚链接，复验双语目录均为六组十二卡；页面代码未因此改变。
- 十二张 1280×960 JPEG 预览重新实拍，均在 1–300 KiB 范围；六套新版桌面、手机画面及分组目录已人工查看。测试命令：`node --test tests/build-site.test.cjs tests/deployed-site-check.test.cjs tests/demo-catalog-links.test.cjs tests/demo-template-links.test.cjs tests/photo-demo-check.test.cjs`，另跑 `tests/demo-registry.test.cjs`；浏览器运行 `demos`、`demo-templates`、`content-dashboard`、`bookstore`、`workshop-booking`、`trip-planner` 六份 spec，前缀复验仅筛选 `templates switch`。
- 证据保存在 `F:/agents/code/temp/demo-templates-20261001-01/`，包括 `unit-boundaries.log`、`unit-registry.log`、`e2e.log`、`e2e-prefix.log`、`output-check.log`、`prefix-check.log`、`prefix-catalog-fixed.log`、组合/独立构建日志、`catalog-desktop.png` 和六套手机截图。回退检查点 `49048d4`；本批仅完成本地验收与提交，未推送、未运行远程 CI、未部署。

## 2026-10-02 - 六案例第三套模板

- 六个现有案例各增加第三套表现模板，共十八个版本：创作者 `archive` 档案索引、摄影 `filmstrip` 胶片长卷、看板 `report` 数据简报、书店 `checklist` 选书清单、工坊 `agenda` 排期总览、旅行 `workbench` 行程工作台。主要变化是编号信息行、连续影像、报告编排、紧凑清单与汇总、场次和课程对照、地点和行程并排操作。
- 新版本复用原有内容、图片、JSON 与交互控制器，只增加模板编排和条件加载样式；`git diff --exit-code` 确认六个案例的 `content/`、`data/`、`static/js/` 和 `hugo.toml` 未改动。原有十二个版本和 URL 保留，六个新 URL 使用 `demos/variants/<case>/<template>/`。没有新增依赖、业务记录或远程素材。
- 双语目录宽屏三列、中屏两列、手机单列；十八张 1280×960 JPEG 预览重新实拍，均符合 1–300 KiB 约束。各 demo README 与总入口同步三套模板的配置和差异。六套新版桌面、手机及购物袋、预约单、地图联动状态已查看，截图保存在本批临时目录。
- 注册表测试与模板 E2E 不再写死两套版本。内容一致性逐版本对照源 JSON，作品详情逐版本对照标题和原图 SHA-256，切换覆盖所有有向模板组合与首页/代表详情页；无脚本检查遍历全部十八个版本。新增六项桌面和手机的阅读顺序验收，并使原有购物袋、排期、看板布局断言识别第三种编排。
- 验证：191 项定向 Node 测试通过（`node --test` 运行 `demo-registry`、`demo-template-links`、`demo-catalog-links`、`build-site`、`photo-demo-check`、四个交互核心及 `deployed-site-check` 的 test 文件）；196 项相关 Chromium E2E 通过，另有 14 项 `/review/` 下的全部模板组合切换通过。浏览器命令使用 `node scripts/run-e2e.cjs`，六份相关 spec、`--workers 2 --max-failures 1`；前缀复验仅筛选 `templates switch`。
- 默认与环境变量指定 `/review/` 的组合构建、两组十八个模板共各 63 页的 Python 链接检查、前缀双语六组十八卡目录、主站产物和内容结构检查均通过。十八次独立构建及其 63 页检查通过，独立模式不含博客返回或模板切换入口。Hugo 资源和缓存只通过进程环境变量写入临时目录。
- 补拍全页截图时曾因与输出目录重建并行导致一次页面暂时不存在；获得继续授权后改为构建结束后串行截图，十二张桌面/手机全页与交互状态截图全部完成。页面与业务代码未为此修改。
- 证据位于 `F:/agents/code/temp/demo-templates-20261002/`：`node-tests.log`、`deployed-check-tests.log`、`e2e.log`、`e2e-prefix.log`、`output-checks.log`、`demo-checks.log`、`prefix-checks.log`、`standalone-checks.log`、构建日志及 `visuals/`。预览总览为 `third-template-overview.jpg`。恢复基线为干净提交 `a2bd0d3`；本批仅本地验收与提交，未推送、未运行远程 CI、未部署。
