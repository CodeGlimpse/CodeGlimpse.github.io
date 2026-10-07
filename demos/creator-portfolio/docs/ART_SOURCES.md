# 原创素材来源与制作记录

三套场景分别创作四件虚构作品，每件含 `cover.svg` 与 `detail.svg`，共二十四张。没有使用客户资料、图库照片、下载字体、外部商标或第三方图形；页面字体使用设备已有的系统字体。

| 内容目录 | 稳定详情目录 | 作品 | 原创构成 |
| --- | --- | --- | --- |
| `content/` | `works/window-light/` | 风从窗沿经过 | 房间、窗帘、猫、绿植与屋顶晾衣场景 |
| `content/` | `works/paper-tide/` | 纸上潮线 | 纸船、灯塔、分层海浪与三段航行 |
| `content/` | `projects/rain-notes/` | 雨天邮差 | 虚构邮差、单车、雨街与道具设定 |
| `content/` | `projects/leaf-atlas/` | 庭院四季 | 盆栽、庭院与四季连续画面 |
| `variants/editorial/content/` | `works/window-light/` | 折光剧场 | 三道折线标志、海报、票券与节目册 |
| `variants/editorial/content/` | `works/paper-tide/` | 丘原咖啡 | 丘线标志、原创包装器物与菜单 |
| `variants/editorial/content/` | `projects/rain-notes/` | 行间书展 | 开合书页图形、海报、折页与展位牌 |
| `variants/editorial/content/` | `projects/leaf-atlas/` | 渡口公共标识 | 岸线路径符号、方向箭头、图标与示意地图 |
| `variants/archive/content/` | `works/window-light/` | 相位花园 | 十二列八行单元的三层圆弧偏移 |
| `variants/archive/content/` | `works/paper-tide/` | 折叠频谱 | 四十八条独立色带经过六个转折点 |
| `variants/archive/content/` | `projects/rain-notes/` | 流场切片 | 七十二条曲线路径受三个虚构区域影响 |
| `variants/archive/content/` | `projects/leaf-atlas/` | 轨道信号 | 二十四条旋转椭圆与离散采样光点 |

## 制作过程

先为每个场景确定内容题材、品牌、配色与页面阅读方式，再逐件编写构图、角色造型、应用器物和细节。插画以曲线路径与色块组成；品牌案例以原创标志和信息布局组成；数字艺术以确定性循环、三角函数和路径偏移组成。每件详情图有独立的分镜、应用说明或局部结构，不是把另一场景的图换颜色。

`scripts/create_original_art.py` 保存全部构成代码和明确的输出路径。在本演示源码目录运行 `python -B -X utf8 scripts/create_original_art.py` 可以重建同一批图片及三个场景图标。该脚本会覆盖列出的演示资产，客户替换图片后不应运行。

所有 SVG 都是本地文件，具有固定的 1200 × 800 画布、不嵌入外部图片或远程资源。它们是为本站制作的原创虚构样例；品牌、演出、展览、地图和艺术署名均无真实客户关系。数字艺术中的相位、频谱、流场与轨道是构成描述，不是测量或模拟结果。

复制后使用素材的权利范围应与网站源码一起明确约定。客户若换入第三方材料，应自行确认发布、商业使用、修改和再分发条件；这份记录不能代替第三方许可证。
