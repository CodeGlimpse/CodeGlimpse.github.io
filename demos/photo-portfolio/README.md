# 留光｜摄影作品集演示

这是供内部验证的独立 Hugo 静态站，模拟虚构摄影师“林予安”的个人作品集。首页、全部作品、三篇详情、关于与联系入口都可用。人物、作品文字和客户情境均为虚构；四张图片均为 **AI 生成演示影像**，不是实拍或真实客户案例。图片来源、具体用途与生成提示词见 [演示影像来源](docs/ASSET_PROVENANCE.md)。

网站用于检验：访问者能否直接看到照片与简介，以及内容所有者能否通过一个 Markdown 文件完成简单文字更新。它没有后台、登录、表单或可视化编辑器。联系邮箱 `contact@example.invalid` 是明确占位，不指向真实第三方，正式使用前必须替换。

## 本地预览与构建

需要 Hugo Extended 0.157.0。在本站目录运行：

```powershell
hugo server
```

默认 `baseURL` 是 `https://blog.codeglimpse.top/demos/photo-portfolio/`，用于集成到博客的子路径。可在本地或客户独立仓库中覆盖，例如：

```powershell
hugo --destination "$env:TEMP\photo-portfolio-build" --baseURL 'https://example.github.io/my-portfolio/' --minify --panicOnWarning
python -B -X utf8 scripts/check_build.py "$env:TEMP\photo-portfolio-build" --base-url 'https://example.github.io/my-portfolio/' --check-demo-pages
```

`--check-demo-pages` 会额外检查本演示首页的“虚构演示”“AI 生成”说明，以及博客集成所需的 `works/rain-street/cover.png`。客户站替换演示内容后应省略此参数；通用模式仍检查必需页面、作品详情、站内链接、`srcset` 图片、替代文字和生成缩略图。博客主 CI 启用演示模式，独立仓库的 Pages 工作流使用通用模式。

`example.github.io` 只是命令示例，不代表已部署。构建输出中的 `previews/rain-street.jpg` 是稳定路径的轻量缩略图；原始 `works/rain-street/cover.png` 仍发布供需要原图的页面使用。页面展示同时生成多个尺寸的 JPEG，浏览器按屏幕宽度选择。源码中的 PNG 不会被改写。本机 Hugo 0.157.0 Windows 对 WebP 处理触发 panic，因此本实验采用同一版本的 Hugo JPEG 处理；具体经过见 [实验记录](docs/EXPERIMENT_LOG.md)。

## 同一作品的三种模板

`filmstrip`：朱红摄影杂志用封面故事、错位图片和编号拼贴组织同一组三个系列。顶部阅读进度随正文滚动更新，详情页继续展示完整原图与原正文。页面 partial 位于 `layouts/partials/filmstrip/`，样式为 `static/css/filmstrip.css`，呈现控制器为 `static/js/filmstrip.js`；继续生成既有 JPEG 缩略图，没有新增照片。集成地址为 `/demos/variants/photo-portfolio/filmstrip/`；独立预览可设置 `$env:HUGO_PARAMS_DEMOTEMPLATE = 'filmstrip'`。

`classic` 保留原来的浅色作品集和图片比例；`gallery` 是黑金影像放映台，每次放映一张图片，可用缩略图、前后按钮或键盘左右方向键切换，Home / End 跳到首尾。图片与标题保留真实详情入口，雨后街角详情可在主图与近景图间切换。关于页用作品索引和人物介绍分栏排版。三个系列、正文、四张原图及 AI 演示声明来自同一份内容与页面资源。

默认独立构建使用 `classic`。在本站目录设置参数即可预览暗色画廊：

```powershell
$env:HUGO_PARAMS_DEMOTEMPLATE = 'gallery'
hugo server
```

构建时同样设置这个参数，并为每个模板使用独立的 `--destination` 与 `--baseURL`。结束后执行 `Remove-Item Env:\HUGO_PARAMS_DEMOTEMPLATE` 恢复默认，或显式选择 `classic`；其他模板名会使构建报错。版式在构建时确定，不保存浏览器状态。

所有页面先加载 `static/css/site.css`；放映台额外加载 `static/css/gallery.css` 和 `static/js/gallery.js`。两套新模板各自拥有首页、列表、详情与关于页结构，并直接读取原有内容和页面资源。关闭 JavaScript 时，放映台按顺序展示所有图片与说明，切换控件隐藏且禁用；杂志页面保留完整阅读内容。两套模板适配 320px，并遵循减少动态效果的系统偏好。照片处理继续使用现有 JPEG 响应式图片与预览资源，没有新增图片、外部字体或外部请求。博客集成的模板入口由父站注入，复制本站独立构建时不依赖博客注册表。

## 修改内容

- `content/works/<英文短名>/index.md`：每组作品的标题、简介、正文及图片说明。
- 与 `index.md` 同目录的 `cover.png`：作品封面；可选 `detail.png`：第二张图。
- `content/about/index.md`：个人介绍。`hugo.toml`：站名、网站说明和联系占位文字。
- `layouts/` 与 `static/css/site.css`：页面结构与样式。`previews/` 由 Hugo 构建生成，不直接编辑。

具体字段、更新与回退步骤见 [更新指南](docs/UPDATE_GUIDE.md)。本次仅完成了执行者自行模拟的 Markdown 更新与本地复构建，尚未由真实非技术用户独立试用。

## 复制到客户自有 GitHub Pages 仓库

将本目录的源码作为**独立仓库根目录**，由客户创建并持有仓库。在仓库 Settings → Pages 中选择 GitHub Actions 作为发布源，再推送到 `main`。随站点提供的 [Pages 工作流](.github/workflows/pages.yml)固定 Hugo 0.157.0，并读取 Pages 返回的地址覆盖 `baseURL`，以适配仓库子路径或客户自己的域名。本地构建已验证；工作流尚未在客户仓库实际运行。

真实交付前，需要将人物介绍、全部 AI 演示图像、作品文字、邮箱与站名替换为客户确认的内容。实际客户取得所交付网站源码的永久使用权，制作方保留通用代码和组件的复用权；具体素材与第三方权利应在实际交付时另行约定。本虚构演示不表示已向任何客户授予模板或 AI 图片的使用权。
