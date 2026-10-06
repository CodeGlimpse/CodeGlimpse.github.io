# 演示影像来源

> **历史归档（2026-10-05 注）：**下文保留的是 2026-09-24“留光”初版的四张 AI 图片与生成提示词。当前三题材站点使用九张真实摄影作品，各专题有独立内容目录；本页旧记录不再是当前素材清单。

## 当前素材记录（2026-10-05）

当前素材以 [PHOTO_SOURCES.json](PHOTO_SOURCES.json)为准：人像 `portrait`、自然 `nature`、天文 `astronomy` 各三张，文件位于 `content/<题材>/works/<作品短名>/cover.jpg`。页面保留原作者或机构、来源、许可与处理说明，图片按清单中的公开许可或公有领域记录选编。

清单中的顶层 `source` 与 `license_url` 对应页面使用的 HTTPS 链接；`source_record` 保存采集时的原始元数据，包含原始 HTTP 链接、HTML 或地区限制提示时也保持原样。顶层链接规范化不等于重新采集或重新核验许可。清单保留下载文件和本地处理文件的 SHA-256、尺寸及处理说明；现有 `verified_at` 为 `2026-10-03`，本轮没有重新核验全部九张图片的许可。

2026-10-05 单独复核《乔治·卡斯特肖像》：[Commons 文件页修订 1254396905](https://commons.wikimedia.org/w/index.php?title=File:George_Armstrong_Custer_by_Brady_1864.jpg&oldid=1254396905)记录作品日期 `1864`、作者 `Creator:Mathew Brady`、许可模板 `PD-US`；原始记录中的境外段落来自该模板的通用提醒。[作者数据修订 2539218737](https://www.wikidata.org/w/index.php?title=Q187850&oldid=2539218737)的卒日字段为 `1896-01-15`。这些证据补充来源页的美国公有领域声明与作者卒年，不构成逐一核定各法域保护期；作品日期也不等同于独立证实的首次发表日期。原始记录保持不变。

复制或更换素材时，应按实际发布地点和用途核对具体条件，并保留适用的署名、来源、许可与修改说明。当前题材、内容更新与构建选择见 [README](../README.md)和 [更新指南](UPDATE_GUIDE.md)。

## 2026-09-24 原始来源记录

本页只记录“留光”内部实验的影像素材。四张图片均于 2026-09-24 使用 Codex 内置 `image_gen` 生成，作为虚构摄影作品集的**AI 生成演示影像**。它们不是摄影师实拍、真实委托作品或客户案例。复制站点交付真实客户前，应替换为客户有权公开发布的素材，并重新核对使用范围。

| 文件 | 页面用途 | 原始大小 |
| --- | --- | ---: |
| `content/works/rain-street/cover.png` | 《雨后街角》封面 | 2,585,802 B |
| `content/works/rain-street/detail.png` | 《雨后街角》详情第二张 | 2,758,369 B |
| `content/works/window-light/cover.png` | 《窗边片刻》封面 | 2,069,624 B |
| `content/works/low-tide/cover.png` | 《退潮线》封面 | 2,450,006 B |

原始生成文件保存在 Codex 的 `generated_images` 目录；项目内的上述文件是副本。站点构建时使用 Hugo 图像处理生成适合网页展示的尺寸与格式，原始素材保留用于独立交付。下面是生成时使用的完整提示词，记录在这里便于核对素材含义和限制。

## 雨后街角封面

```text
Use case: photorealistic-natural
Asset type: landscape cover photograph for an explicitly fictional internal portfolio demo, series 01, 'Rain after the city'.
Scene: an empty narrow East Asian city street just after light rain, early blue hour, glowing shop windows reflected in wet pavement, a bicycle parked near a storefront, no people.
Style: contemporary editorial architectural photography, believable optics and natural texture, restrained color, quiet observational mood.
Composition: landscape 3:2, strong visual depth, ample clean dark upper area for cropping, no collage or border.
Constraints: no logos, legible signage, typography, watermark, artificial-looking glow, recognizable landmark, or existing artist style. This will be openly labeled as AI-generated demo imagery, not a real photographer's work.
```

## 窗边片刻封面

```text
Use case: photorealistic-natural
Asset type: landscape cover photograph for an explicitly fictional internal photographer portfolio demo, series 02, 'Window light'.
Scene: a simple ceramic cup and a folded linen napkin on a small wooden table by a tall apartment window, overcast morning, view of out-of-focus roofs beyond the glass. No people.
Style: contemporary editorial still-life photography, tactile and unretouched, natural grain, warm cream and muted brown.
Composition: landscape 3:2, off-center subject, generous negative space, no collage or border.
Constraints: no logos, legible text, watermark, recognizable brand, or imitation of any named photographer. Openly labeled AI-generated demo imagery.
```

## 退潮线封面

```text
Use case: photorealistic-natural
Asset type: landscape cover photograph for an explicitly fictional internal photographer portfolio demo, series 03, 'Coast at low tide'.
Scene: quiet tidal flats and a low concrete breakwater on a hazy morning, a few small puddles reflecting a pale sky, no people or boats.
Style: restrained contemporary landscape photography, realistic optics, natural textures, gentle cool palette, subtle atmospheric perspective.
Composition: landscape 3:2, long horizontal lines, sky occupies upper third, no collage or border.
Constraints: no logos, text, watermark, recognizable landmark, or imitation of a named photographer. Openly labeled AI-generated demo imagery.
```

## 雨后街角细节图

```text
Use case: photorealistic-natural
Asset type: second detail photograph for an explicitly fictional internal photographer portfolio demo, same conceptual series as an empty rainy East Asian city street at blue hour.
Scene: close observational view of layered rain reflections on a sidewalk beside a small storefront, a single parked bicycle wheel entering the frame, cool dusk and warm window light. No people.
Style: believable contemporary editorial street photograph with natural grain and realistic reflections.
Composition: landscape 3:2, close street-level framing, distinct composition from a wide street overview, no collage or border.
Constraints: no logos, legible signage, text, watermark, recognizable landmark, or named photographer style. Openly labeled AI-generated demo imagery.
```
