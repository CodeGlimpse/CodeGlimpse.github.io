# 留光摄影作品集：内部实验记录

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
