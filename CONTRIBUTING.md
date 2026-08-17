# 贡献指南

感谢你为 CodeGlimpse.github.io 提交改进。

## 开始之前

- 使用 Hugo Extended 0.157.0、Go 1.23.6 和 Node.js 22 系列。
- 中文内容放在 `content/zh-cn/`，英文内容放在 `content/en/`。
- 在线工具的页面、浏览器脚本和核心逻辑应保持清晰对应。
- 不要提交 `.env`、访问令牌、私钥、构建产物或本地临时文件。

## 开发流程

1. 从 `master` 创建一个描述清楚的功能分支。
2. 修改代码或内容，并同步更新中英文页面（如果适用）。
3. 为核心逻辑补充正常输入、无效输入和边界值测试。
4. 在项目根目录运行：

   ```bash
   npm run check
   npm run test:e2e
   ```

   第一条命令检查工具链版本、内容结构、单元测试、Hugo 构建产物以及 JSON、robots.txt、sitemap 和双语工具页面；第二条命令针对生成的 `public/` 运行浏览器端到端测试。

5. 检查 `git diff`，确认只包含本次任务相关文件。
6. 使用清晰、聚焦的提交信息提交变更，并创建 Pull Request。

## 工具开发约定

工具页面通常包含：

```text
content/zh-cn/tools/<id>/index.md
content/en/tools/<id>/index.md
assets/js/tools/<id>.js
assets/js/tools/<id>-core.js
```

页面通过 `{{< tool id="<id>" >}}` 加载工具。纯函数和可复用逻辑应放在 `*-core.js`，浏览器 DOM 交互放在对应的 `<id>.js`。

工具只在浏览器本地处理用户输入时，应在页面中明确说明，不要把数据发送到第三方服务。

## 发布与 Pull Request

- Pull Request 会运行 JavaScript、内容结构、Node 测试和 Hugo 构建检查。
- 推送到 `master` 后，部署工作流会将构建结果发布到 `gh-pages`。
- 主题更新工作流会创建 Pull Request；合并前应再次运行完整检查。
