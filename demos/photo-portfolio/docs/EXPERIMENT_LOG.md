# 留光摄影作品集：内部实验记录

> **历史归档（2026-10-05 注）：**下文的模拟简报、12 分 07 秒耗时、四张 AI 图片与构建结果仅对应 2026-09-24 初版实验。它们不表示当前人像、自然、天文三个专题已通过本轮验收。

## 2026-10-05 本轮概况

- 当前站点分为“目光 · 人像摄影”“野境 · 自然摄影”“遥光 · 天文摄影”，分别使用 `content/portrait`、`content/nature`、`content/astronomy`，每组有三张不同的真实摄影作品。
- 模板标识仍为 `classic`、`gallery`、`filmstrip`。本轮核对了本地演示注册表、Hugo 配置、作品字段、布局入口与来源清单，并同步 [README](../README.md)和 [更新指南](UPDATE_GUIDE.md)，明确独立构建时须匹配内容目录、模板参数与发布地址。
- 当前素材来源以 [PHOTO_SOURCES.json](PHOTO_SOURCES.json)为准；顶层 HTTPS 链接用于页面，`source_record` 保留原始采集证据。清单的许可核验日期仍为 `2026-10-03`；卡斯特肖像的单项来源补充见 [来源说明](ASSET_PROVENANCE.md)。九张本地图片的 SHA-256 与清单一致。

### 本轮本地验收

- 修复了检查样例仍引用旧样式表、未打开弹窗中的空图片、三处 CC0 展示链接使用 HTTP，以及 Hugo 创建预览资源后未引用发布地址导致缺少缩略图的问题。原图弹窗在首次打开时创建图片并设置真实描述，再次打开复用该图片；关闭和 Escape 均恢复按钮焦点。
- 人像标题保留两行，自然标题遵循内容中的换行，天文首页主图按原始比例显示。重新拍摄三套 1280×960 JPEG 目录预览；查看了三套 390px 与 1440px 全页截图，等待所有正文图片加载完成后再截图。
- 181 项相关 Node 测试通过：构建、注册表、部署检查和摄影检查器 53 项；模板及目录链接检查器 128 项。191 项 Chromium 浏览器用例通过，覆盖三种摄影题材、九篇详情、原图、题材切换、无脚本、键盘焦点、手机布局和其他演示的组合导航。浏览器验收使用仓库的 `serve-public.cjs`；补齐 JPEG MIME 类型，让本地原图响应与图片类型一致。
- 组合构建、全部十八个演示版本的链接/资源检查、主站产物检查通过。三种摄影题材还分别以独立站方式构建到 `/review/` 子路径，每套均通过 6 个 HTML 页面、3 篇作品与 3 张缩略图检查。没有安装或升级依赖。
- 测试入口（在博客仓库根目录）：`node --test tests/build-site.test.cjs tests/demo-registry.test.cjs tests/check-demo-builds.test.cjs tests/deployed-site-check.test.cjs tests/photo-demo-check.test.cjs`；`node --test tests/demo-template-links.test.cjs tests/demo-catalog-links.test.cjs`；`node node_modules/@playwright/test/cli.js test e2e/photo-feature.spec.cjs e2e/demo-polish.spec.cjs e2e/demo-templates.spec.cjs e2e/demos.spec.cjs e2e/portfolio-presentation.spec.cjs --workers=4`。
- 组合构建使用 `scripts/build-site.cjs --destination F:/agents/code/temp/photo-genres-20261003/public`，复用现有 Hugo 缓存并关闭 Go 网络下载；`SITE_ROOT` 指向该目录运行 `scripts/check-demo-builds.cjs` 和 `scripts/check-build-output.cjs`。浏览器使用 `E2E_BASE_URL=http://127.0.0.1:4195`、`E2E_USE_LOCAL_SERVER=false` 访问该产物。
- 证据在 `F:/agents/code/temp/photo-genres-20261003/`：`tests-20261005.log`、`link-tests-20261005.log`、`e2e-final-20261005.log`、`build-delivery.log`、`check-demos-delivery.log`、`check-output-delivery.log` 和 `handoff-*.png`。以上是本机验证；未推送、未部署，也没有记录客户独立试用或其他系统上的人工验收。

## 2026-09-24 原始实验记录

## 模拟设计简报

- **对象：**虚构摄影师“林予安”；站名“留光｜摄影作品集演示”。
- **内容：**《雨后街角》《窗边片刻》《退潮线》三组 AI 生成的虚构演示影像。
- **呈现：**奶油白与深灰的安静编辑式排版。打开首页即可看图，能进入作品详情，能找到简介和联系入口；手机上保持导航可见。
- **验证：**初版构建后真实改写一篇 Markdown 的一句话，再复构建，检查输出。使用的四张 AI 图片及原始提示词见 [来源记录](ASSET_PROVENANCE.md)。

## 时间与范围

- 实施开始：2026-09-24 21:44:08（北京时间）。
- 实施结束：2026-09-24 21:56:15（北京时间）。
- 实际实施耗时：12 分 07 秒（从创建站点目录与复制素材开始，至完成本地构建、静态检查及清理生成缓存）。
- 客户真实操作开始／结束／耗时：未进行，不填模拟值。

## 已观察到的步骤

1. 确认本机 Hugo Extended `v0.157.0`，将四张 AI 生成 PNG 复制到三个作品的 page bundle。原始 PNG 不修改。
2. 初版《雨后街角》正文含“街道刚安静下来，橱窗里的光先落到地上。”，用 `hugo --destination "$env:TEMP\photo-portfolio-jpeg-copy-20260924" --minify --panicOnWarning` 构建成功：7 页、4 个原图资源、15 个处理后的图像。初版输出 HTML 确认包含旧句。
3. 随后将该句改为“街道渐渐安静，橱窗里的暖光落在尚未干透的路面上。”。复构建命令为 `hugo --destination "$env:TEMP\photo-portfolio-final-20260924" --minify --panicOnWarning`，退出码 `0`，仍为 7 页、4 个原图资源、15 个处理后的图像。直接比较两次输出的《雨后街角》HTML：初版旧句存在、新句不存在；复构建后旧句不存在、新句存在。
4. 对默认博客子路径运行 `python -B -X utf8 scripts/check_build.py "$env:TEMP\photo-portfolio-final-20260924" --base-url 'https://blog.codeglimpse.top/demos/photo-portfolio/'`，通过：6 个 HTML 文件、3 篇作品详情、3 个固定 JPEG 缩略图，站内链接与图片替代文字有效。
5. 另外以 `--baseURL 'https://example.github.io/my-portfolio/'` 构建到 `$env:TEMP\photo-portfolio-override-20260924`，并用对应地址再次运行同一检查，通过。这个地址只用于验证客户独立仓库的子路径覆盖，尚未部署。

## 图像处理卡点与处理

- 首次使用 Hugo `Resize "… webp …"`，命令退出码 `1`，报 `panic: runtime error: invalid memory address or nil pointer dereference`，栈顶为 `github.com/gohugoio/hugo/internal/warpc.(*Dispatchers).Close`。去掉 `resources.Copy` 后再试仍触发同一 panic，因此触发点在本机 Hugo 0.157.0 Windows 的 WebP 处理路径，不应把失败构建算作通过。
- 改为 Hugo `Resize "… jpg …"` 后，`--minify --panicOnWarning` 构建成功。`resources.Copy` 输出固定文件 `previews/rain-street.jpg`（63,557 B），相比原始 `cover.png`（2,585,802 B）显著更小；其他两张缩略图分别为 39,856 B 和 63,939 B。详情页还生成 640、1080、1440 宽的 JPEG 展示尺寸。
- 这一结果只说明当前机器上的基础压缩和输出路径可用；没有宣称 WebP 在其他系统也会失败。

## 验证边界

本次由制作执行者自行模拟一次 Markdown 更新、检查构建输出。没有让非技术真实用户在其自有仓库中独立操作，也没有验证其理解、用时、误操作或求助需求；这部分应在实际试用后单独记录。GitHub Actions 工作流与客户自有 Pages 账户也尚未实际运行。
