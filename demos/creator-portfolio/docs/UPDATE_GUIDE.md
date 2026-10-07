# 更新作品指南

本站使用 Markdown 内容与同目录图片。先确认选中的场景，再编辑它的内容目录。

| 场景 | 内容目录 | 预览配置 |
| --- | --- | --- |
| 岛页插画 | `content/` | `hugo.toml` |
| 拾度设计 | `variants/editorial/content/` | `hugo.toml,variants/editorial/config.toml` |
| 回声单元 | `variants/archive/content/` | `hugo.toml,variants/archive/config.toml` |

## 改站名与介绍

编辑所选内容目录中的 `_index.md`。`title` 用于浏览器页面标题，`brand` 用于导航品牌，`summary` 用于首页描述；`homeHeading` 与 `homeIntro` 是首页正文。`aboutHeading`、`aboutCopy` 和 `footerNote` 分别用于关于区域与页脚。替换演示作品时，也应按实际情况修改 `demoNotice` 和 `favicon` 指向的图标。不要只改 `hugo.toml` 的通用标题，否则各场景首页仍会使用自己的品牌。

## 修改现有作品

1. 在所选内容目录中进入 `works/` 或 `projects/`，打开作品的 `index.md`。
2. 修改顶部字段和下方正文。保留成对的 `---`、字段名称和冒号。
3. 把封面和过程图片放在同一作品目录。`cover` 只写文件名，`cover_alt` 用一句话说明图片内容；正文使用 `![图片说明](detail.svg)` 或实际文件名。
4. 使用该场景的配置预览，检查首页、分类列表、详情图文与手机排版。提交后，还要等待 Pages 工作流完成并检查公开页面。

## 字段说明

所有作品保留 `title`、`summary`、`category`、`cover`、`cover_alt` 和 `weight`。`weight` 越小，排序越靠前；封面说明与正文图片说明应具体描述画面，不能留空。

拾度场景还使用 `caseType`、`year` 与 `deliverables`，分别说明命题类型、制作年份和设计内容。回声单元还使用 `recordId`、`medium`、`rule` 与 `year`，用于创作记录的编号、媒介、构成规则与年份。修改作品时同步这些信息，不把艺术命名当成真实客户关系、科学测量或实时数据。

## 新增作品

1. 在同一场景的 `works/` 或 `projects/` 下新建小写英文短名目录，复制该场景同类型作品的 `index.md`。
2. 写入新标题、简介、分类、排序和场景所需信息，上传自己的封面与正文图片。
3. 检查内容、图片授权和本地链接，再提交更新。文件名使用小写英文、数字与连字符可减少大小写错误。

作品目录决定详情网址。当前四个目录名为兼容旧链接而保留，标题无需与目录名一致；如果确实要改名，应在新页面 frontmatter 加入旧网址的 `aliases` 并验证跳转。场景切换总是进入目标首页，各场景不共用作品内容。

## 检查与恢复

当前演示可使用 README 中带 `--check-demo-pages --scene <场景>` 的命令，检查品牌、实际标题、正文与图片完整性。替换为客户自己的作品后，运行 `python scripts/check_build.py <输出目录> --base-url <构建地址>` 检查本地链接与图片说明，不要求示例作品的名称或数量。

- 图片消失时，检查文件名、大小写、扩展名和所在作品目录。
- 页面没有出现时，检查 `index.md` 的位置、成对的 `---` 和 `draft` 设置。
- 网站没有更新时，先查看仓库 Actions 的 Pages 工作流；提交成功不等于发布成功。
- 误改时，从此前 Git 提交恢复指定文件并重新提交，保留其他人的修改。

实际交付应由客户在自己持有的仓库中完成一次内容更新，并确认列表、详情和手机页面。原始 SVG 复现脚本只用于制作当前演示，客户替换素材后不要运行它，以免覆盖自己的图片。
