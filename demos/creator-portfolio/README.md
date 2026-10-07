# 创作者作品集：三个独立场景

这是可复制为独立 Hugo 仓库的作品集样本。每个场景独立包含自己的品牌、四篇作品详情、八张原创 SVG 和创作说明；全部为虚构演示，不代表真实客户、出版或公共设施项目。

| 场景 | 内容与视觉 | 内容目录 |
| --- | --- | --- |
| `classic` 岛页插画 | 日常叙事、图画书与植物插画；雾蓝纸面、宋体标题和双列画廊 | `content/` |
| `editorial` 拾度设计 | 四组虚构品牌命题；钴蓝海报、章节导航与设计应用大图 | `variants/editorial/content/` |
| `archive` 回声单元 | 相位、色带、流场与轨道数字艺术；深靛档案、参数记录与选中预览 | `variants/archive/content/` |

三个场景各有首页、两个作品分类页和四个详情页。旧的 `works/window-light/`、`works/paper-tide/`、`projects/rain-notes/`、`projects/leaf-atlas/` 网址全部保留，场景中的作品内容完全独立。归档预览和章节导航支持键盘；关闭 JavaScript 后仍可浏览所有图文与详情。

## 独立预览与构建

需要 Hugo Extended 0.157.0。进入本目录，选一个场景：

```powershell
# 岛页插画（默认）
hugo server --config hugo.toml

# 拾度设计：同时选择版式与内容
hugo server --config hugo.toml,variants/editorial/config.toml

# 回声单元：同时选择版式与内容
hugo server --config hugo.toml,variants/archive/config.toml
```

无需单独设置 `HUGO_PARAMS_DEMOTEMPLATE`；若之前设置过该环境变量，先清除它，以免覆盖配置文件。独立构建不显示博客的“场景”菜单或返回目录。博客集成中的菜单进入目标场景首页，每套仍可独立复制和运行。

以下以拾度为例，检查 GitHub 项目仓库子路径下的本地输出：

```powershell
hugo --config hugo.toml,variants/editorial/config.toml --destination "$env:TEMP/creator-editorial-build" --baseURL 'https://example.github.io/creator-editorial/' --minify --panicOnWarning
python -B -X utf8 scripts/check_build.py "$env:TEMP/creator-editorial-build" --base-url 'https://example.github.io/creator-editorial/' --check-demo-pages --scene editorial
```

默认场景使用 `--config hugo.toml` 与 `--scene classic`；数字艺术场景使用 `variants/archive/config.toml` 与 `--scene archive`。检查包含全部七页、各套实际标题与品牌、详情正文和两张图片、图片说明及本地链接。占位域名仅用于检查，不是已上线地址。

## 内容更新

每个场景的首页 `_index.md` 保存 `title`、`brand`、`homeHeading`、`homeIntro`、简介、关于说明和页脚。每件作品是一个页面目录，目录内有 `index.md`、`cover.svg` 与 `detail.svg`。内容可以继续使用普通 Markdown；详见[更新指南](docs/UPDATE_GUIDE.md)。

给客户制作时，选定一个场景，替换该场景首页品牌、所有虚构作品与图标。保留更新所需字段，并把客户已取得发布权的图片放到对应作品目录；客户自己的内容检查无需传 `--check-demo-pages` 或 `--scene`，这些选项用于核验当前演示作品。本站没有后台、登录或本地可视化编辑器。

## 复制后发布

把本目录作为独立仓库根目录。客户自己创建并持有 GitHub 仓库，在 Settings → Pages 中选择 GitHub Actions。随附 `.github/workflows/pages.yml` 使用 Hugo 0.157.0，默认发布 `classic`；选择其他场景时，在工作流的 Hugo 构建命令中加入相同的 `--config hugo.toml,variants/<场景>/config.toml`。

这里验证的是本地构建与页面行为。没有替客户创建账户、购买域名或在客户仓库触发发布。源码、账户、域名与费用边界以实际约定和第三方条款为准。

## 素材记录

二十四张作品 SVG 由原创几何路径、角色造型、品牌应用图及确定性数学规则绘制，未下载照片、字体或第三方图形。[素材来源与制作记录](docs/ART_SOURCES.md)列出全部作品与复现方法。真实内容仍应使用客户有权公开发布的材料；第三方材料须按各自许可证使用。实际交付时应明确网站源码使用权和通用组件复用权。
