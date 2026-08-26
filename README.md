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

安装 Hugo 模块后启动本地预览：

```bash
hugo mod download
hugo server -D
```

默认开发地址为 `http://localhost:1313/`。

## 检查与构建

站点运行时不依赖第三方 npm 包；开发环境使用 Playwright 执行浏览器测试：

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
hugo --cleanDestinationDir --minify --gc
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

工具页面支持“分享与导出”：分享链接只在用户点击后生成，并将当前输入和选项放在 URL 片段中；不要把敏感信息放入分享链接。导出快照会下载当前工具的输入、选项和结果字段，文件只在本地生成。

站点还提供渐进式离线能力：访问过的页面和资源会由 Service Worker 缓存，断网时可继续打开缓存页面并使用浏览器端工具。离线缓存不是数据同步或云端备份，部署新版本后缓存会按版本自动清理。

当前工具包括：

- Base64 编码/解码
- 进制转换
- BMI 计算
- 颜色转换
- CSV 与 JSON 转换
- Diff 文本对比
- HTML 实体编码/解码
- JSON 格式化、压缩、校验、转义与反转义
- JSONPath 查询
- JWT 解析
- Markdown 预览
- MD5 哈希
- 安全密码生成
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
- 搜索页额外生成 JSON：`/search/index.json` 和 `/en/search/index.json`。
- `static/robots.txt` 和 sitemap 用于搜索引擎抓取。
- `baseurl` 配置在 `config/_default/config.toml`。

## 发布流程

推送到 `master` 后，`.github/workflows/deploy.yml` 会自动：

1. 安装固定版本的 Go、Node.js 和 Hugo Extended。
2. 检查所有工具脚本语法。
3. 运行 Node.js 测试。
4. 构建并压缩 Hugo 站点。
5. 将 `public/` 部署到 `gh-pages`。

工作流中的第三方 Actions 使用完整 commit SHA 固定，并通过 `check:workflow` 检查；部署后的 Smoke Test 会检查中英文全部工具路由、关键静态资源和 HTML 工具容器。

也可以在 GitHub Actions 页面手动运行 `Build and deploy to GitHub Pages` 工作流。Pull Request 只执行构建检查，不会发布到生产站点。

## 主题更新

`.github/workflows/update-theme.yml` 每周一运行一次，也支持手动触发。它会更新 Hugo Stack 模块、验证构建和浏览器 E2E，并创建主题更新 Pull Request。主题升级合并前应检查模块差异、桌面端和移动端页面，并重新运行：

```bash
npm run check
npm run test:e2e
```

`.github/workflows/site-monitor.yml` 每周一运行线上只读巡检，也支持手动触发。它覆盖首页、索引、搜索资源、sitemap、robots.txt、全部 44 个双语工具页面、页面元数据以及页面引用的本地 CSS、JavaScript 和图片资源。

## 提交前清单

- [ ] 内容 front matter 完整，未误设置 `draft: true`
- [ ] 中英文页面或工具保持同步
- [ ] `npm run check` 通过
- [ ] `npm run test:e2e` 通过
- [ ] 检查生成的搜索 JSON、sitemap 和 robots.txt
- [ ] 确认首页 JSON 未生成，搜索页 JSON 正常生成
- [ ] 确认 Service Worker 和离线回退资源已发布
- [ ] 确认敏感工具（JWT、密码）未开放 URL 分享
- [ ] 确认 `git diff` 只包含本次任务相关文件

## 贡献与安全

- 贡献流程见 [`CONTRIBUTING.md`](CONTRIBUTING.md)。
- 在线工具隐私说明和安全问题报告方式见 [`SECURITY.md`](SECURITY.md)。

## 维护说明

构建产物 `public/`、Hugo 资源缓存 `resources/` 和 `.hugo_build.lock` 已加入 `.gitignore`。请不要提交本地临时文件、凭据或 `.env` 文件。

长期维护流程、版本升级、发布验证和故障回滚见 [`docs/maintenance.md`](docs/maintenance.md)，维护记录格式见 [`docs/maintenance-log.md`](docs/maintenance-log.md)。
产品扩展边界、离线和本地预设能力见 [`docs/product-expansion.md`](docs/product-expansion.md)。
