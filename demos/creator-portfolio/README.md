# 创作者作品集演示站

这是一个可独立复制到客户自有 GitHub 仓库的 Hugo 静态站样本，用原创的虚构作品验证两种展示：图片画廊和设计项目案例。它不代表真实客户案例，也不是已经交付的本地可视化编辑器。

## 当前可检查的交付

- 首页、图片作品列表及详情、项目案例列表及详情。
- 四组原创 SVG 演示素材；各作品的文字与图片放在同一个页面目录中。
- 手机与桌面布局、键盘导航、图片替代文本和基本页面描述。
- Markdown 内容更新路径及一个供独立仓库使用的 GitHub Pages 工作流。

站点没有后台、登录、拖拽布局或自动 Git 提交功能。本地编辑器会在内容结构与客户更新流程验证后单独开发；首版计划仅支持 Windows、由卖家交付的站点与客户自有 GitHub 仓库。

## 本地预览

需要 Hugo Extended 0.157.0。在此目录运行：

```powershell
hugo server
```

打开命令显示的本地地址。构建并检查类似 GitHub 项目仓库的子路径：

```powershell
hugo --destination "$env:TEMP\portfolio-demo-build" --baseURL 'https://example.github.io/portfolio-demo/' --minify --panicOnWarning
python -B -X utf8 'scripts\check_build.py' "$env:TEMP\portfolio-demo-build" --base-url 'https://example.github.io/portfolio-demo/' --check-demo-pages
```

`example.github.io` 和 `portfolio-demo` 只是构建检查用的占位地址，不是已经上线的网址。

## 内容结构

- `content/works/<英文短名>/index.md`：普通图片作品。
- `content/projects/<英文短名>/index.md`：有背景、思路与展示内容的项目案例。
- 与 `index.md` 同目录的 `cover.svg`：列表和详情页封面；正文可以引用同目录的其他图片。
- `hugo.toml`：站点名称与演示说明。

给真实客户复制时，须先替换 `hugo.toml` 中的站名、首页标题与介绍、页面描述，清空 `demoNotice` 和 `footerNote`，替换全部示例作品与图片，并按客户标识替换 `static/favicon.svg`。完成这些替换后再对外发布；当前示例文案不能代表真实客户项目。

每篇内容的开头字段包括 `title`、`summary`、`category`、`cover`、`cover_alt` 和 `weight`。`weight` 数字越小，排序越靠前。各字段的含义与更新步骤见 [更新指南](docs/UPDATE_GUIDE.md)。

## 复制到客户仓库后发布

把本目录的内容作为**独立仓库根目录**，客户自己创建并持有 GitHub 仓库，在仓库的 Settings → Pages 中选择 GitHub Actions 作为发布源，随后推送到 `main`。`.github/workflows/pages.yml` 固定 Hugo 0.157.0，按 Pages 提供的地址设置构建 `baseURL`。网站源码、内容、域名与账户的权利和费用仍以双方约定及第三方服务条款为准。

这里只验证了本地构建。尚未在客户仓库实际触发 GitHub Actions，也没有替客户创建账户、购买域名或部署到自有服务器。

## 素材与复用

本演示站的文字与 SVG 为原创虚构样例，不含客户信息。复制给客户时应替换成客户已取得公开发布权的素材。若改用第三方免费模板、字体、图标或图片，应逐项核对其商业使用、修改、署名和再分发条件。

实际订单应写明已确认的源码权利边界：客户取得交付网站源码的永久使用权，制作方保留通用代码和组件的复用权。第三方材料遵守各自许可证；本地编辑器的授权范围需在其开发后另行约定。
