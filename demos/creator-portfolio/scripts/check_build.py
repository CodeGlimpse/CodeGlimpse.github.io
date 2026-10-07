"""Check local links and image descriptions in a Hugo Pages build."""

from __future__ import annotations

import argparse
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit


REQUIRED_PAGES = (
    "index.html",
    "works/index.html",
    "projects/index.html",
    "works/window-light/index.html",
    "works/paper-tide/index.html",
    "projects/rain-notes/index.html",
    "projects/leaf-atlas/index.html",
)

SCENES = {
    "classic": {
        "brand": "岛页",
        "headings": ("把寻常日子画成小小的岛", "单幅插画", "系列创作", "风从窗沿经过", "纸上潮线", "雨天邮差", "庭院四季"),
    },
    "editorial": {
        "brand": "拾度",
        "headings": ("让一个想法成为可辨认的形状", "品牌识别", "文化与空间", "折光剧场", "丘原咖啡", "行间书展", "渡口公共标识"),
    },
    "archive": {
        "brand": "回声单元",
        "headings": ("把规则留下，把偶然展开", "生成图像", "空间实验", "相位花园", "折叠频谱", "流场切片", "轨道信号"),
    },
}


def valid_template_url(value: str) -> bool:
    if "%" in value or "\\" in value or any(ord(char) < 32 or 127 <= ord(char) <= 159 for char in value):
        return False
    try:
        parsed = urlsplit(value)
    except ValueError:
        return False
    decoded = unquote(parsed.path)
    return (not parsed.scheme and not parsed.netloc and parsed.path == value
            and value.startswith("/") and value.endswith("/")
            and not any(part in (".", "..") for part in decoded.split("/")))


class PageChecker(HTMLParser):
    def __init__(self, page: Path, output: Path, prefix: str, catalog_url: str | None = None) -> None:
        super().__init__()
        self.page = page
        self.output = output
        self.prefix = prefix
        self.catalog_url = catalog_url
        self.template_urls: set[str] = set()
        self.errors: list[str] = []
        self.template: str | None = None
        self.h1_values: list[str] = []
        self.title = ""
        self.description = ""
        self.image_count = 0
        self.prose = ""
        self.in_h1 = False
        self.in_title = False
        self.in_prose = False
        self.text_values: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
        if tag == "body":
            self.template = values.get("data-template")
        if tag == "h1":
            self.h1_values.append("")
            self.in_h1 = True
        if tag == "title":
            self.in_title = True
        if tag == "meta" and values.get("name") == "description":
            self.description = values.get("content") or ""
        if tag == "article" and "prose" in (values.get("class") or "").split():
            self.in_prose = True
        if tag == "img":
            self.image_count += 1
        if tag == "img" and not values.get("alt"):
            self.errors.append(f"{self.page}: image has no alt text")
        for attr in ("href", "src"):
            raw = values.get(attr)
            if tag == "a" and attr == "href" and "data-demo-template" in values and self.template_urls:
                if raw not in self.template_urls:
                    self.errors.append(f"{self.page}: template link must point to an allowed URL: {raw}")
                    continue
                if "data-demo-catalog" not in values or self.catalog_url is None:
                    continue
            if not raw:
                continue
            if tag == "a" and attr == "href" and "data-demo-catalog" in values and self.catalog_url is not None:
                if raw != self.catalog_url:
                    self.errors.append(f"{self.page}: catalog link must point to {self.catalog_url}: {raw}")
                continue
            if raw.startswith(("#", "mailto:", "data:")):
                continue
            parsed = urlsplit(raw)
            if parsed.scheme or parsed.netloc:
                continue
            pathname = unquote(parsed.path)
            if pathname.startswith("/"):
                if not pathname.startswith(self.prefix):
                    self.errors.append(f"{self.page}: path misses site prefix: {raw}")
                    continue
                target = self.output / pathname.removeprefix(self.prefix)
            else:
                target = self.page.parent / pathname
            if raw.endswith("/") or target.is_dir():
                target /= "index.html"
            target = target.resolve()
            if not target.is_relative_to(self.output):
                self.errors.append(f"{self.page}: local target escapes site output: {raw}")
                continue
            if not target.is_file():
                self.errors.append(f"{self.page}: missing local target: {raw}")

    def handle_endtag(self, tag: str) -> None:
        if tag == "h1":
            self.in_h1 = False
        if tag == "title":
            self.in_title = False
        if tag == "article":
            self.in_prose = False

    def handle_data(self, data: str) -> None:
        self.text_values.append(data)
        if self.in_h1:
            self.h1_values[-1] += data
        if self.in_title:
            self.title += data
        if self.in_prose:
            self.prose += data

    def check_content(self, expected_scene: str | None) -> None:
        if self.template not in SCENES:
            self.errors.append(f"{self.page}: missing or unknown scene: {self.template}")
            return
        if expected_scene and self.template != expected_scene:
            self.errors.append(f"{self.page}: expected scene {expected_scene}, got {self.template}")
        scene = SCENES[self.template]
        if len(self.h1_values) != 1:
            self.errors.append(f"{self.page}: expected exactly one h1")
        if scene["brand"] not in self.title or not self.description.strip():
            self.errors.append(f"{self.page}: scene title or page description is missing")
        if "弧光" in "".join(self.text_values):
            self.errors.append(f"{self.page}: old shared brand leaked into scene")
        relative = self.page.relative_to(self.output).as_posix()
        if relative in REQUIRED_PAGES:
            expected = scene["headings"][REQUIRED_PAGES.index(relative)]
            if [value.strip() for value in self.h1_values] != [expected]:
                self.errors.append(f"{self.page}: expected authored heading {expected}")
            if relative == "index.html":
                content = "".join(self.text_values)
                if any(title not in content for title in scene["headings"][3:]) or "虚构演示" not in content:
                    self.errors.append(f"{self.page}: homepage must include all four authored works and disclosure")
            elif relative not in ("works/index.html", "projects/index.html"):
                if self.image_count < 2 or len(self.prose.strip()) < 100:
                    self.errors.append(f"{self.page}: detail must contain cover, authored process image, and substantial text")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("output", type=Path, help="Hugo output directory")
    parser.add_argument("--base-url", required=True, help="Base URL used for this Hugo build")
    parser.add_argument("--check-demo-pages", action="store_true", help="Require all authored pages and content for the detected scene")
    parser.add_argument("--scene", choices=SCENES, help="Require this scene's brand, headings, and authored detail content")
    parser.add_argument("--catalog-url", help="Allow only a marked catalog link to this exact root-relative directory path")
    parser.add_argument("--template-url", action="append", default=[], help="Allow a marked template link to this exact root-relative directory path")
    args = parser.parse_args()
    for template_url in args.template_url:
        if not valid_template_url(template_url):
            parser.error("--template-url must be an exact root-relative directory path")
    if args.catalog_url is not None:
        catalog = urlsplit(args.catalog_url)
        if (catalog.scheme or catalog.netloc or catalog.path != args.catalog_url
                or not args.catalog_url.startswith("/") or not args.catalog_url.endswith("/")
                or "\\" in unquote(catalog.path)
                or any(part in (".", "..") for part in unquote(catalog.path).split("/"))):
            parser.error("--catalog-url must be an exact root-relative directory path")
    output = args.output.resolve()
    base_path = urlsplit(args.base_url).path.strip("/")
    prefix = f"/{base_path}/" if base_path else "/"
    errors: list[str] = []

    if args.check_demo_pages:
        for relative in REQUIRED_PAGES:
            if not (output / relative).is_file():
                errors.append(f"missing page: {relative}")
    for page in output.rglob("*.html"):
        checker = PageChecker(page, output, prefix, args.catalog_url)
        checker.template_urls = set(args.template_url)
        checker.feed(page.read_text(encoding="utf-8"))
        if args.check_demo_pages or args.scene:
            checker.check_content(args.scene)
        errors.extend(checker.errors)

    if errors:
        print("\n".join(errors))
        return 1
    checks = "scene content, local links and image descriptions" if args.check_demo_pages or args.scene else "local links and image descriptions"
    print(f"OK: {len(list(output.rglob('*.html')))} pages, {checks}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
