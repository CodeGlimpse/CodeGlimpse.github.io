"""Check rendered links, image descriptions, and small previews in a Hugo build."""

from __future__ import annotations

import argparse
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit


class PageChecker(HTMLParser):
    def __init__(self, page: Path, output: Path, prefix: str) -> None:
        super().__init__()
        self.page = page
        self.output = output
        self.prefix = prefix
        self.errors: list[str] = []

    def check_url(self, raw: str) -> None:
        if not raw or raw.startswith(("#", "data:", "mailto:", "tel:")):
            return
        parsed = urlsplit(raw)
        if parsed.scheme or parsed.netloc:
            return
        path = unquote(parsed.path)
        if path.startswith("/"):
            if not path.startswith(self.prefix):
                self.errors.append(f"{self.page}: URL misses base path: {raw}")
                return
            target = self.output / path.removeprefix(self.prefix)
        else:
            target = self.page.parent / path
        if path.endswith("/") or target.is_dir():
            target /= "index.html"
        if not target.is_file():
            self.errors.append(f"{self.page}: missing local target: {raw}")

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
        if tag == "img" and not (values.get("alt") or "").strip():
            self.errors.append(f"{self.page}: image lacks meaningful alt text")
        for attribute in ("href", "src"):
            if values.get(attribute):
                self.check_url(values[attribute] or "")
        if values.get("srcset"):
            for entry in (values["srcset"] or "").split(","):
                self.check_url(entry.strip().split()[0])


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("output", type=Path)
    parser.add_argument("--base-url", required=True)
    args = parser.parse_args()
    output = args.output.resolve()
    base_path = urlsplit(args.base_url).path.strip("/")
    prefix = f"/{base_path}/" if base_path else "/"
    errors: list[str] = []

    for relative in ("index.html", "works/index.html", "about/index.html"):
        if not (output / relative).is_file():
            errors.append(f"missing page: {relative}")
    work_pages = sorted((output / "works").glob("*/index.html"))
    if not work_pages:
        errors.append("no work detail pages")

    home = output / "index.html"
    if home.is_file():
        home_text = home.read_text(encoding="utf-8")
        for notice in ("虚构演示", "AI 生成"):
            if notice not in home_text:
                errors.append(f"home page missing disclosure: {notice}")

    pages = sorted(output.rglob("*.html"))
    for page in pages:
        checker = PageChecker(page, output, prefix)
        checker.feed(page.read_text(encoding="utf-8"))
        errors.extend(checker.errors)

    preview_files = sorted((output / "previews").glob("*.jpg"))
    if len(preview_files) < len(work_pages):
        errors.append("fewer generated JPEG previews than work detail pages")
    for preview in preview_files:
        if preview.stat().st_size <= 0:
            errors.append(f"empty preview: {preview}")
    if not (output / "works/rain-street/cover.png").is_file():
        errors.append("missing original rain-street cover for blog integration")

    if errors:
        print("\n".join(errors))
        return 1
    print(f"OK: {len(pages)} HTML pages, {len(work_pages)} works, {len(preview_files)} previews, local links and alt text")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
