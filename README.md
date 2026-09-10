# CodeGlimpse.github.io

基于 Hugo Stack 的个人博客与在线工具站点，使用 GitHub Pages 发布。

网站地址：[https://blog.codeglimpse.top](https://blog.codeglimpse.top)

## 项目结构

```text
content/                 博客、页面和中英文在线工具内容
assets/js/tools/         在线工具页面脚本和可测试核心逻辑
layouts/                 Hugo 模板和 shortcode
config/_default/         Hugo 配置、菜单和主题参数
tests/                   Node.js 内置测试
scripts/                 本地维护检查脚本
.github/workflows/       构建、发布和主题更新工作流
```

## 开发环境

建议使用与 CI 一致的工具版本：

- Git
- Go 1.23.6
- Hugo Extended 0.157.0
- Node.js 22.13.1

也可以使用 `.devcontainer/` 创建开发容器。容器配置固定了 Hugo 和 Go 版本，Node 使用 22 系列开发镜像。

## 本地开发

安装锁定的 npm 依赖和 Hugo 模块后启动本地预览：

```bash
npm ci --ignore-scripts
hugo mod download
hugo server -D
```

默认开发地址为 `http://localhost:1313/`。

## 检查与构建

YAML 和 XML 工具分别使用锁定版本的 `yaml` 与 `@xmldom/xmldom`，由 Hugo 打包为本站 JavaScript，仅在对应工具页面加载；输入仍在浏览器本地处理，不使用 CDN。第三方许可证随站点发布到 `/licenses.txt`。开发环境使用 Playwright 执行浏览器测试；首次运行前安装 Chromium：`npx playwright install chromium`。Windows PowerShell 使用 `npm.cmd` 和 `npx.cmd`。

```bash
npm test              # 运行工具核心逻辑测试
npm run check:js      # 检查在线工具 JavaScript 语法
npm run check:content # 检查内容 front matter、工具双语结构和 shortcode
npm run check:contrast # 检查分类标签颜色对比度
npm run check:workflow # 检查工作流 action SHA 固定和权限约束
npm run check:versions # 检查 CI 与开发容器版本一致性
npm run build         # 执行 Hugo 生产构建
npm run check:output  # 检查发布目录、JSON、robots、sitemap 和工具页面
npm run check         # 依次执行版本、语法、内容、测试、构建和输出检查
npm run test:e2e      # 针对 public/ 运行浏览器端到端测试
```

直接运行等价命令：

```bash
node scripts/check-js.cjs
node scripts/check-content.cjs
node scripts/check-workflows.cjs
node scripts/run-tests.cjs
node scripts/build-site.cjs
node scripts/check-build-output.cjs
```

## 在线工具开发

每个工具通常由以下文件组成：

```text
content/zh-cn/tools/<id>/index.md
content/en/tools/<id>/index.md
assets/js/tools/<id>.js
assets/js/tools/<id>-core.js       # 需要单元测试的纯逻辑
```

新增或修改工具时，应覆盖正常输入、空值、非法输入和边界值，并运行 `npm run check`。

工具注册表 scripts/tool-registry.cjs 同时维护分类、关键词和相关工具；工具索引会据此提供搜索、分类筛选、收藏和最近使用。本站只在浏览器本地处理输入，收藏和最近使用只保存工具 ID。

工具页面支持“分享与导出”：分享链接只在用户点击后生成，并将当前输入和选项放在 URL 片段中；不要把敏感信息放入分享链接。导出快照会下载当前工具的输入、选项和结果字段，文件只在本地生成。二维码和图片工具直接下载图片，不提供输入分享链接或 JSON 快照；实现说明见 [docs/media-tools.md](docs/media-tools.md)。

站点还提供渐进式离线能力：成功访问的同源页面和资源会由 Service Worker 缓存，断网或服务器返回 5xx 时优先使用已有成功页面，再回退到离线说明页。带内容指纹的脚本与样式直接使用缓存；搜索索引等固定 URL 资源优先联网更新，断网或 5xx 时使用成功缓存。离线缓存不是数据同步或云端备份；缓存版本升级时只清理本站旧版本缓存，需再次访问工具页面以建立新缓存。

站点默认加载 Google Analytics 4、百度统计和 Microsoft Clarity，用于页面访问与整体交互分析。页面底部会显示双语隐私提示，工具输入、输出、密码、JWT、分享 Hash 和本地预设不会作为统计事件发送；工具表单和结果区域带有 Clarity 屏蔽标记。用户可以在 [隐私说明](/privacy/) 页面关闭后续统计脚本。

当前工具包括：

- Base64 编码/解码
- 进制转换
- BMI 计算
- 颜色转换
- CSV 与 JSON 转换
- Diff 文本对比
- HTML 实体编码/解码
- 图片压缩与尺寸调整
- JSON 格式化、压缩、校验、转义与反转义
- JSONPath 查询
- JWT 解析
- Markdown 预览
- MD5 哈希
- 安全密码生成
- 二维码生成与解析
- 正则表达式测试与替换
- SHA 哈希
- SQL 格式化
- 文本统计与转换
- Unix 时间戳转换
- URL 编码/解码
- UUID 生成与校验
- XML 格式化与校验
- YAML 与 JSON 转换

## 内容与输出约定

- 中文内容位于 `content/zh-cn/`，英文内容位于 `content/en/`。
- 首页输出为 HTML 和 RSS，不生成首页 JSON。
- 所有博客页额外生成文章搜索 JSON：`/archives/index.json` 和 `/en/archives/index.json`。
- `static/robots.txt` 和 sitemap 用于搜索引擎抓取。
- `baseurl` 配置在 `config/_default/config.toml`。

## 发布流程

推送到 `master` 后，`.github/workflows/deploy.yml` 会自动：

1. 安装固定版本的 Go、Node.js 和 Hugo Extended。
2. 按 lockfile 安装 npm 依赖，执行版本、工作流、JavaScript、内容、下载脚本和对比度检查。
3. 运行 Node.js 测试，构建 Hugo 站点并校验产物中的源提交标记。
4. 对同一份构建产物运行浏览器 E2E。
5. 将通过验证的 `public/` 部署到 `gh-pages`，再执行线上 Smoke Test。

工作流中的第三方 Actions 使用完整 commit SHA 固定，并通过 `check:workflow` 检查；部署后的 Smoke Test 会检查中英文全部工具路由、关键静态资源和 HTML 工具容器。

也可以在 GitHub Actions 页面手动运行 `Build and deploy to GitHub Pages` 工作流。Pull Request 只执行构建检查，不会发布到生产站点。

## 主题更新

`.github/workflows/update-theme.yml` 每周一运行一次，也支持手动触发。它会更新 Hugo Stack 模块、验证构建和浏览器 E2E，并创建主题更新 Pull Request。主题升级合并前应检查模块差异、桌面端和移动端页面，并重新运行：

```bash
npm run check
npm run test:e2e
```

`.github/workflows/site-monitor.yml` 每日 06:00 UTC（北京时间 14:00）运行线上只读巡检，也支持手动触发。它覆盖首页、索引、搜索资源、sitemap、robots.txt、全部 48 个双语工具页面、页面元数据以及页面引用的本地 CSS、JavaScript 和图片资源，并校验部署源提交。

项目复核结果与后续开发顺序见 [`docs/project-review-2026-09-06.md`](docs/project-review-2026-09-06.md)。

博客提供双语关于页及 OpenClaw 文章内的前后篇导航，通用阅读入口使用分类和归档。首页 RSS 只订阅文章；审查过程记录在维护文档中。维护结果和后续选题见 [`docs/content-maintenance-2026-09-07.md`](docs/content-maintenance-2026-09-07.md)。

游戏栏目位于 `/games/` 和 `/en/games/`，提供十九款双语小游戏，支持按中英文名称、别名和玩法关键词即时搜索。新增舒尔特方格、连连看和本地双人五子棋。游戏直接在页面运行，点击开始后加载代码，刷新重置单局，不提供存档。实现与扩展方式见 [`docs/games.md`](docs/games.md)。

博客、工具、游戏分别在各自目录内搜索；博客搜索入口位于 `/archives/`，旧 `/search/` 地址已删除。手机首页提供文章、工具、游戏的固定底栏；工具页提供专注模式，游戏目录支持玩法筛选和随机选择。实现与验证说明见 [`docs/site-usability.md`](docs/site-usability.md)。后续新增内容仅列为候选，见 [`docs/next-content-candidates-2026-09-08.md`](docs/next-content-candidates-2026-09-08.md)。

## 提交前清单

- [ ] 内容 front matter 完整，未误设置 `draft: true`
- [ ] 中英文页面或工具保持同步
- [ ] `npm run check` 通过
- [ ] `npm run test:e2e` 通过
- [ ] 检查生成的搜索 JSON、sitemap 和 robots.txt
- [ ] 确认首页 JSON 未生成，博客搜索 JSON 正常生成，旧搜索地址不再生成
- [ ] 确认 Service Worker 和离线回退资源已发布
- [ ] 确认敏感工具（JWT、密码）未开放 URL 分享
- [ ] 确认统计披露、Clarity 屏蔽标记和退出开关正常
- [ ] 确认 `git diff` 只包含本次任务相关文件

## 贡献与安全

- 贡献流程见 [`CONTRIBUTING.md`](CONTRIBUTING.md)。
- 在线工具隐私说明和安全问题报告方式见 [`SECURITY.md`](SECURITY.md)。

## 维护说明

构建产物 `public/`、Hugo 资源缓存 `resources/` 和 `.hugo_build.lock` 已加入 `.gitignore`。请不要提交本地临时文件、凭据或 `.env` 文件。

长期维护流程、版本升级、发布验证和故障回滚见 [`docs/maintenance.md`](docs/maintenance.md)，维护记录格式见 [`docs/maintenance-log.md`](docs/maintenance-log.md)。
产品扩展边界、离线和本地预设能力见 [`docs/product-expansion.md`](docs/product-expansion.md)。
