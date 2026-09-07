# 内容维护与阅读导航（2026-09-07）

五篇教程的中英文版本已完成官方资料复核；新增关于、系列阅读和 OpenClaw 系列入口，文章可按顺序前后跳转。首页 RSS 现只包含文章，避免订阅工具和隐私页面。

本阶段运行代码已以 `3e2085d042df864e414201cec0210cf2433e65e4` 发布。[Actions Run 34084725573](https://github.com/CodeGlimpse/CodeGlimpse.github.io/actions/runs/34084725573) 的 Build、E2E、Deploy 全部成功；独立线上巡检通过 76 个端点与 147 个资源，12 项线上浏览器抽查通过。后续提交仅补充发布记录和方案文档。

## 教程修订与依据

| 文章 | 本次修订 | 主要官方依据 |
| --- | --- | --- |
| OpenClaw 安装 | 更新 Node.js 要求；区分 npm 12/11.16+ 与旧版命令；采用当前 pnpm 全局脚本许可方式；补 Gateway 验收；第三方分支不再混入官方安装步骤 | [Install](https://docs.openclaw.ai/install) |
| OpenClaw 浏览器 | 撤下未经发布记录支撑的精确版本迁移结论；说明 `openclaw`、`user`、`chrome` 三种模式；更新 CLI、授权与配对检查 | [Browser](https://docs.openclaw.ai/tools/browser)、[Chrome extension](https://docs.openclaw.ai/tools/chrome-extension) |
| OpenClaw 卸载 | 先预览内置卸载范围，再区分服务、状态、工作区、应用和 CLI；保留附带脚本及原 SHA-256；说明脚本覆盖范围 | [Uninstall](https://docs.openclaw.ai/install/uninstall) |
| Python 安装 | 增加 Install Manager 与虚拟环境；将旧截图标为历史示例；纠正统一管理员安装、Homebrew 前提和错误横线；移除删除 APT 锁、递归改所有者及整机升级的安装步骤 | [Windows](https://docs.python.org/3/using/windows.html)、[macOS](https://docs.python.org/3/using/mac.html)、[venv](https://docs.python.org/3/library/venv.html)、[Homebrew](https://docs.brew.sh/Installation) |
| Fail2ban | 限定 Debian/Ubuntu + systemd 示例；先确认日志来源；使用小型 `.local` 覆盖；区分 journal 与文件后端；先检查配置；纠正重启与持久化说明 | [项目说明](https://github.com/fail2ban/fail2ban)、[jail.conf](https://github.com/fail2ban/fail2ban/blob/master/config/jail.conf)、[fail2ban.conf](https://github.com/fail2ban/fail2ban/blob/master/config/fail2ban.conf) |

资料获取日期为 2026-09-07。Python 页面标注为 3.14.7 文档，正文按 3.14 系列说明；OpenClaw 与 Fail2ban 的资料是获取时的官方文档/主分支，不能当作对任意旧版本的保证。公开资料的下载记录、原文和 SHA-256 保存在本轮临时目录。

`review_date` 与 `review_scope` 在文章顶部明确展示资料复核日期和范围。`lastmod` 记录内容修改，不代表实机安装测试日期。本轮未安装 OpenClaw、变更本机 Python、修改 Linux 服务或执行卸载；这些实测仍应在指定环境中单独记录。

## 阅读入口

- 关于：`/about/`、`/en/about/`。使用用户确认的 Fernweh 昵称和已有公开联系方式。
- 系列目录：`/series/`、`/en/series/`；OpenClaw 专页：`/series/openclaw/`、`/en/series/openclaw/`。
- OpenClaw 阅读顺序由 `series_id: openclaw` 与 `series_order: 1/2/3` 表达；导航在当前语言内生成，并标注当前文章。
- 原文章地址、发布日期、附带下载脚本及截图文件得到保留。标题调整的文章已有固定 slug。
- 文章可以通过 `tool_related` 展示相关工具；JSON 示例与完整 OpenClaw JSON5 配置的验证边界已说明。
- 首页 RSS 的地址和文章 GUID 保持稳定；每种语言目前各包含 5 篇文章。新增入口不进入文章订阅。

## 验证

- `npm.cmd test`：130/130 通过。
- `npm.cmd run test:e2e -- --workers 2`：61/61 通过，新增 7 项双语阅读与 RSS 验证，覆盖系列前后跳转、作者与订阅入口、XML 解析、文章集合及移动布局。
- 版本、工作流、JavaScript、内容、下载脚本与对比度门禁通过；Windows 本地跳过 `bash -n`，Ubuntu 发布 CI 负责该项。
- Hugo 独立构建 ZH 60 / EN 59，产物检查包含新页面、RSS 文件及完整源提交标记。
- 已查看桌面关于页与手机暗色系列导航截图。
- 线上检查扩展为 76 个端点，新增双语关于、系列目录、OpenClaw 系列和 RSS；发布后以实际源提交验收。

构建、截图和日志位于 `F:/agents/code/temp/codeglimpse-handoff-20260907-01a079a5/`，本阶段产物目录为 `editorial-public/`。发布流程见 [GitHub Actions](https://github.com/CodeGlimpse/CodeGlimpse.github.io/actions/workflows/deploy.yml)。

## 后续四次内容交付建议

建议围绕“自动化工具的使用与维护”和“开发环境与 Linux 运维”两个方向积累内容。下面是候选顺序，不设置自动发布日程；如果采用每周一次，可以作为四周计划。

| 顺序 | 选题 | 发布前需要的证据 |
| --- | --- | --- |
| 1 | Windows 上排查 Python、py、pip 与 PATH 冲突 | 在隔离环境记录版本、解释器路径、虚拟环境和错误输出；补新版界面截图 |
| 2 | OpenClaw 三种浏览器模式的实际验收 | 用测试页面分别记录 profile、连接状态、授权、快照结果和失败恢复；不使用私人登录数据 |
| 3 | Fail2ban 从日志到封禁的完整验证 | 使用 Linux 测试机、独立管理入口和受控测试来源；记录 journal/file 两种后端与恢复步骤 |
| 4 | Hugo/Pages 从本地验收到发布与回退 | 复用本站真实检查链与 Actions 记录；展示源提交、产物、部署检查以及经过验证的恢复方案 |

每篇先完成能复现的主要语言版本，再同步另一种语言的命令、日期和来源。发布日期由实际验证进度决定。

## 工具扩展的取舍

已有 22 个工具，当前阶段优先完善阅读和内容正确性。没有访问后台或用户任务证据时，不把预设 UI、批处理和 Worker 当作已确定需求。

| 候选 | 进入实现前先确认 |
| --- | --- |
| 本地预设 UI | 是否反复输入同一组非敏感选项；现有接口的按工具隔离、配额和删除体验是否足够 |
| 批处理 | 用户实际处理的格式、数量与错误反馈方式，避免单纯增加复杂度 |
| 大文本 Worker | 用代表性输入测量耗时和交互阻塞，再决定迁移哪些工作 |
| 其他浏览器 | 根据目标设备验证 Firefox/WebKit，记录差异后决定修复范围 |

真实统计 SDK 的网络行为和后台脱敏设置仍未验证；现有浏览器测试使用供应商空脚本。游戏栏目按用户要求只完成了[可行方案](games-column-proposal-2026-09-07.md)，未创建功能、页面或游戏资源。
