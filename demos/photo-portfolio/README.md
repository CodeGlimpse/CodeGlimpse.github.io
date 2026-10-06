# 摄影专题演示：目光 / 野境 / 遥光

这是一个独立 Hugo 静态站，提供人像、自然、天文三个摄影专题。每个专题有自己的首页、作品列表、三篇详情和“关于与来源”页面，使用各自的三张真实摄影作品与文字。人物肖像为历史作品选编，天文专题为望远镜观测影像；页面保留原作者或机构、来源和许可说明。本站不冒充原作者，也不暗示其认可本站。

网站用于检验照片浏览、作品故事、来源署名以及 Markdown 内容更新流程，没有后台、登录、表单或可视化编辑器。当前九张图片的来源、许可、处理说明和文件校验记录见 [PHOTO_SOURCES.json](docs/PHOTO_SOURCES.json)。早期四张 AI 图片的 [来源记录](docs/ASSET_PROVENANCE.md)与 [实验记录](docs/EXPERIMENT_LOG.md)已标为历史归档。

## 三个独立专题

`classic`、`gallery`、`filmstrip` 保留为博客集成的模板标识。当前每个标识同时对应一个题材和一套视觉呈现；三个专题使用不同作品，切换入口会进入目标专题首页。

| 模板标识 | 专题 | 内容目录 | 博客集成路径 |
| --- | --- | --- | --- |
| `classic` | 目光 · 人像摄影，明亮的编辑式排版 | `content/portrait` | `/demos/photo-portfolio/` |
| `gallery` | 野境 · 自然摄影，宽幅风景画册 | `content/nature` | `/demos/variants/photo-portfolio/gallery/` |
| `filmstrip` | 遥光 · 天文摄影，深色观测影像展览 | `content/astronomy` | `/demos/variants/photo-portfolio/filmstrip/` |

博客主项目的 [演示注册表](../../data/demos.json)为各专题指定 `contentDir`、独立发布路径与预览图。本站的默认配置为 `content/portrait`，模板默认为 `classic`。独立构建时必须同时匹配内容目录和 `demoTemplate`；只改模板参数会把另一题材的内容套进所选版式。

## 本地预览与构建

需要 Hugo Extended 0.157.0。在本站目录预览默认人像专题：

```powershell
$env:HUGO_PARAMS_DEMOTEMPLATE = 'classic'
hugo server --contentDir 'content/portrait' --baseURL 'http://localhost:1313/'
```

预览自然专题时，同时选择模板和内容目录：

```powershell
$env:HUGO_PARAMS_DEMOTEMPLATE = 'gallery'
hugo server --contentDir 'content/nature' --baseURL 'http://localhost:1313/'
```

天文专题使用 `filmstrip` 与 `content/astronomy`。其他模板名会使构建报错。停止预览后可执行 `Remove-Item Env:\HUGO_PARAMS_DEMOTEMPLATE`，恢复默认模板选择。

默认 `baseURL` 为 `https://blog.codeglimpse.top/demos/photo-portfolio/`。为其他专题或客户独立站构建时，使用与目标地址一致的 `--baseURL`，并为每次构建指定独立输出目录。例如构建自然专题：

```powershell
$env:HUGO_PARAMS_DEMOTEMPLATE = 'gallery'
hugo --contentDir 'content/nature' --destination "$env:TEMP\photo-portfolio-nature-build" --baseURL 'https://example.github.io/my-portfolio/' --minify --panicOnWarning
python -B -X utf8 scripts/check_build.py "$env:TEMP\photo-portfolio-nature-build" --base-url 'https://example.github.io/my-portfolio/' --check-demo-pages
Remove-Item Env:\HUGO_PARAMS_DEMOTEMPLATE
```

`example.github.io` 只是命令示例，不表示已部署。`--check-demo-pages` 检查本演示首页的“摄影专题演示”“真实摄影作品”说明，以及每篇作品详情的 HTTPS 来源和许可链接。替换成客户内容后，可按实际用途省略此参数；通用模式仍检查必需页面、作品详情、站内链接、`srcset` 图片、替代文字和生成缩略图。检查脚本核对构建产物，不会联网重新确认图片许可或证明线上发布成功。

当前页面结构位于 `layouts/`，三题材的样式与原图查看控制器为 `static/css/genres.css` 和 `static/js/genres.js`。Hugo 从各作品的 `cover.jpg` 生成多个尺寸的 JPEG，浏览器按屏幕宽度选择；`previews/<作品短名>.jpg` 是构建生成的稳定缩略图路径。“查看完整原图”展示本地保存的完整构图版本，该版本可能已按来源清单记录进行缩小或格式转换。

## 修改内容与来源

- `content/<题材>/works/<英文短名>/index.md`：作品标题、简介、正文、图片描述、作者与许可字段。
- 与 `index.md` 同目录的 `cover.jpg`：当前作品图片。
- `content/<题材>/_index.md`：专题品牌、首页标题与简介；`works/_index.md`：作品列表标题与简介。
- `content/<题材>/about/index.md`：专题介绍与素材使用说明。
- `hugo.toml`：默认内容目录与站点配置；`docs/PHOTO_SOURCES.json`：素材来源和处理记录。

具体字段、更新和回退步骤见 [更新指南](docs/UPDATE_GUIDE.md)。根 `content/works/` 下的旧演示内容不在当前三题材的构建目录内，修改它不会更新这些专题。生成的 `previews/` 与 `resources/_gen/` 不直接编辑。

来源清单中每条记录的顶层 `source`、`license_url` 对应当前页面使用的链接；页面实际读取作品 `index.md` 的同名字段，更新素材时须同步两处。`source_record` 保存采集时的原始元数据，可能含 HTTP 链接、HTML 和地区限制提示。顶层链接使用 HTTPS 不代表重新采集原始记录。现有 `verified_at` 为 `2026-10-03`；2026-10-05 对卡斯特肖像的单项来源复核见 [来源说明](docs/ASSET_PROVENANCE.md)，不代表全部图片已重新核验。

## 复制到客户自有 GitHub Pages 仓库

将本目录源码作为独立仓库根目录，由客户创建并持有仓库。随站点提供的 [Pages 工作流](.github/workflows/pages.yml)固定 Hugo 0.157.0，并读取 Pages 返回的地址覆盖 `baseURL`，以适配仓库子路径或客户域名。

该工作流直接读取 `hugo.toml`。若独立站选择自然或天文专题，应在配置中同时设置对应的 `contentDir` 与 `[params]` 下的 `demoTemplate`；本地 PowerShell 的环境变量不会自动传到 GitHub Actions。随后在 Settings → Pages 选择 GitHub Actions 为发布源，并按客户仓库的发布流程提交内容。提交完成、Actions 成功和线上页面可访问需分别确认。

真实交付前，应将专题品牌、简介和作品文字替换为客户确认的内容，逐张核对素材及其具体使用条件。保留第三方摄影作品时须保留适用的作者署名、来源、许可及修改说明，并留意来源记录中的地区限制；网站源码的交付约定不能代替第三方素材许可。客户独立试用、其 Pages 工作流和线上发布结果应在实际执行后另行记录。
