# 页面问题反馈

- 工具详情与游戏详情的说明末尾展示 GitHub、邮件两个入口；工具专注模式内隐藏反馈区域，退出后恢复。首页、文章和栏目目录不增加反馈面板。
- 模板位于 `layouts/partials/feedback.html`；GitHub 使用 `.github/ISSUE_TEMPLATE/site-feedback.md`，邮箱沿用站内已有公开地址。
- 标题与正文在 Hugo 构建时生成，仅预填页面标题、规范 URL 和静态问题提示。不会读取工具输入、图片、游戏状态、浏览器存储、实时查询参数或片段。
- 邮件 URL 采用百分号编码的空格和换行；GitHub 链接在新标签页打开并带有 noopener/noreferrer。访客自行填写并发送，本次开发不提交 Issue 或邮件。
- 仓库 Issues 已开启，默认分支为 master。`e2e/feedback.spec.cjs` 覆盖中英文、工具/游戏、敏感测试标记排除、邮件/GitHub 目标及手机布局。
