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
