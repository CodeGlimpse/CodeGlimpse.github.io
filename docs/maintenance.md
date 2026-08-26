# 长期维护手册

本文档说明 CodeGlimpse.github.io 的日常维护、版本更新、发布验证和故障处理流程。目标是让每次变更都能被验证、追溯和回滚。

## 维护分层

| 层级 | 触发时机 | 主要检查 |
| --- | --- | --- |
| 本地开发 | 每次修改后 | `npm.cmd run check`、相关 E2E |
| Pull Request | 每个 PR | CI 版本、工作流、内容、测试和构建 |
| 发布后 | 每次推送到 `master` | 构建产物、E2E、线上端点和资源 |
| 定期维护 | 每周或每月 | 线上监控、主题更新、工具链版本复核 |

## 常用命令

在 Windows PowerShell 中使用 `npm.cmd`：

```powershell
npm.cmd run check
npm.cmd run test:e2e
npm.cmd run check:site -- https://blog.codeglimpse.top
npm.cmd run check:versions
```

`npm.cmd run check` 会依次检查版本、工作流安全、JavaScript 语法、双语内容、单元测试、Hugo 构建和构建产物。`test:e2e` 针对最新 `public/` 运行浏览器测试；`check:site` 检查线上中英文页面、工具路由、元数据、本地资源和预期的 404。

## 功能变更流程

1. 从 `master` 创建分支，确认工作区干净。
2. 修改实现、测试和中英文页面。
3. 为工具补充成功、错误和边界测试；页面保持示例、限制和本地处理说明。
4. 运行 `npm.cmd run check` 和 `npm.cmd run test:e2e`。
5. 检查 `git diff --check`、`git status` 和构建产物变化。
6. 提交聚焦变更并创建 Pull Request。
7. 等待 PR 工作流通过后合并到 `master`。
8. 发布工作流完成后查看 Actions Summary 和线上 Smoke Test。

## 发布流程

`.github/workflows/deploy.yml` 使用同一份构建产物完成以下阶段：

```text
Build and test -> Browser E2E -> Deploy gh-pages -> Online smoke test
```

构建摘要会记录源提交、Go/Hugo/Node.js 版本、HTML 页面数量和双语工具页面数量。部署阶段还会记录线上端点和本地资源巡检结果。只有 `master` 推送或 `master` 上的手动运行才会部署，Pull Request 不会触碰生产站点。

## 主题更新流程

`.github/workflows/update-theme.yml` 每周一 00:00 UTC 运行，也可以手动触发。它会：

1. 更新 Hugo Stack 模块并整理 `go.mod`、`go.sum`。
2. 运行版本、工作流、内容、JavaScript、单元测试和构建产物检查。
3. 安装 Chromium 并运行浏览器 E2E。
4. 在 Actions Summary 中记录模块差异和构建指标。
5. 创建或更新 `automation/update-hugo-theme` Pull Request。

主题更新 PR 必须人工查看首页、工具索引、工具页面、搜索页、深色模式和移动端布局后再合并。

## 线上监控

`.github/workflows/site-monitor.yml` 每周一 06:00 UTC 运行，也支持手动触发。它不重新部署，只访问 `https://blog.codeglimpse.top`，对短暂网络错误重试后检查：

- 中文默认路由和英文路由。
- 22 个工具的 44 个双语页面。
- 页面标题、描述、Canonical 和 hreflang。
- 工具容器、工具脚本、公共脚本和 CSS。
- 页面引用的本地图片、脚本和样式资源。
- 全站 Toast、离线脚本和离线回退资源。
- 搜索 JSON、robots.txt、sitemap 和预期的首页 JSON 404。

监控失败时先查看失败端点，再根据最近部署提交判断是代码、主题、资源、DNS 还是持续性网络问题。监控不会自动修改代码或回滚。部署后的 Smoke Test 会等待最多约 120 秒，以覆盖 GitHub Pages/CDN 的短暂传播延迟。

## 版本更新策略

- 补丁版本：可以单独升级，随后运行完整 `check` 和 E2E。
- 小版本升级：单独创建维护 PR，重点查看 Playwright、Hugo 和主题兼容性。
- 大版本升级：不要和功能开发混合，先建立迁移分支和回滚点。
- 修改版本前运行 `npm.cmd run check:versions`，确保工作流、开发容器和本地配置一致。

当前版本由 `.github/workflows/deploy.yml` 作为基准，并由 `scripts/check-versions.cjs` 对比主题工作流和 `.devcontainer/` 配置。

## 故障处理和回滚

### 构建或 E2E 失败

查看失败 job 的第一处错误，在本地使用相同命令复现。不要为了让 CI 变绿而跳过测试；如果是预期页面变化，应同步更新测试和文档。

### 线上 Smoke Test 失败

记录失败时间、端点、部署提交和工作流 Run ID。先确认是全站失败还是单个资源失败，再检查最近一次代码、主题或工具链变更。

### 需要回滚

使用最近一个已验证的源代码提交重新运行发布工作流。不要直接手工修改 `gh-pages`，不要强制推送或改写 `master` 历史。回滚完成后重新运行线上 `check:site`。

## 维护记录

每次主题、工具链或线上故障处理都应在 [`maintenance-log.md`](maintenance-log.md) 追加记录，至少包含日期、类型、影响范围、验证命令、结果、提交和工作流 Run ID。
