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

项目不依赖第三方 npm 包，使用 Node.js 内置能力运行检查：

```bash
npm test              # 运行工具核心逻辑测试
npm run check:js      # 检查在线工具 JavaScript 语法
npm run check:content # 检查内容 front matter、工具双语结构和 shortcode
npm run build         # 执行 Hugo 生产构建
npm run check         # 依次执行语法检查、内容检查、测试和生产构建
```

直接运行等价命令：

```bash
node scripts/check-js.cjs
node scripts/check-content.cjs
node scripts/run-tests.cjs
hugo --cleanDestinationDir --minify --gc
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

当前工具包括：

- Base64 编码/解码
- 进制转换
- BMI 计算
- 颜色转换
- JSON 格式化、压缩、校验、转义与反转义
- MD5 与 SHA 哈希
- Unix 时间戳转换

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

也可以在 GitHub Actions 页面手动运行 `Build and deploy to GitHub Pages` 工作流。Pull Request 只执行构建检查，不会发布到生产站点。

## 主题更新

`.github/workflows/update-theme.yml` 每天运行一次，也支持手动触发。它会更新 Hugo Stack 模块、验证构建，并创建主题更新 Pull Request。主题升级合并前应重新运行：

```bash
npm run check
```

## 提交前清单

- [ ] 内容 front matter 完整，未误设置 `draft: true`
- [ ] 中英文页面或工具保持同步
- [ ] `npm run check` 通过
- [ ] 检查生成的搜索 JSON、sitemap 和 robots.txt
- [ ] 确认 `git diff` 只包含本次任务相关文件

## 贡献与安全

- 贡献流程见 [`CONTRIBUTING.md`](CONTRIBUTING.md)。
- 在线工具隐私说明和安全问题报告方式见 [`SECURITY.md`](SECURITY.md)。

## 维护说明

构建产物 `public/`、Hugo 资源缓存 `resources/` 和 `.hugo_build.lock` 已加入 `.gitignore`。请不要提交本地临时文件、凭据或 `.env` 文件。
