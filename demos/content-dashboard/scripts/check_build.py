"""Check a standalone or integrated dashboard build without a blog dependency."""

from __future__ import annotations

import argparse
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit


class PageChecker(HTMLParser):
    def __init__(self, page: Path, output: Path, base_url: str, catalog_url: str | None):
        super().__init__()
        self.page = page
        self.output = output
        self.base = urlsplit(base_url)
        self.prefix = self.base.path.rstrip("/") + "/"
        self.catalog_url = catalog_url
        self.errors: list[str] = []

    def check_url(self, raw: str) -> None:
        if not raw or raw.startswith(("#", "mailto:", "data:")):
            return
        parsed = urlsplit(raw)
        if (parsed.scheme or parsed.netloc) and (parsed.scheme, parsed.netloc) != (self.base.scheme, self.base.netloc):
            return
        pathname = unquote(parsed.path)
        if "\\" in pathname:
            self.errors.append(f"{self.page}: local target escapes site output: {raw}")
            return
        if not pathname:
            target = self.page
        elif pathname.startswith("/"):
            if not pathname.startswith(self.prefix):
                self.errors.append(f"{self.page}: path misses site prefix: {raw}")
                return
            target = self.output / pathname.removeprefix(self.prefix)
        else:
            target = self.page.parent / pathname
        if pathname.endswith("/") or target.is_dir():
            target /= "index.html"
        target = target.resolve()
        if not target.is_relative_to(self.output):
            self.errors.append(f"{self.page}: local target escapes site output: {raw}")
        elif not target.is_file():
            self.errors.append(f"{self.page}: missing local target: {raw}")

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
        if tag == "img" and not values.get("alt"):
            self.errors.append(f"{self.page}: image has no alt text")
        for attribute in ("href", "src"):
            raw = values.get(attribute)
            if not raw:
                continue
            if tag == "a" and attribute == "href" and "data-demo-catalog" in values and self.catalog_url is not None:
                if raw != self.catalog_url:
                    self.errors.append(f"{self.page}: catalog link must point to {self.catalog_url}: {raw}")
                continue
            self.check_url(raw)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("output", type=Path)
    parser.add_argument("--base-url", required=True)
    parser.add_argument("--check-demo-pages", action="store_true", help="Require the original dashboard pages, scripts and disclosure")
    parser.add_argument("--catalog-url", help="Allow this exact marked root-relative catalog anchor")
    args = parser.parse_args()
    if args.catalog_url is not None:
        catalog = urlsplit(args.catalog_url)
        if (catalog.scheme or catalog.netloc or catalog.path != args.catalog_url
                or not args.catalog_url.startswith("/") or not args.catalog_url.endswith("/")
                or "\\" in unquote(catalog.path)
                or any(part in (".", "..") for part in unquote(catalog.path).split("/"))):
            parser.error("--catalog-url must be an exact root-relative directory path")

    output = args.output.resolve()
    pages = sorted(output.rglob("*.html"))
    errors: list[str] = []
    required = ["index.html"]
    if args.check_demo_pages:
        required += ["about/index.html", "css/site.css", "js/dashboard-core.js", "js/dashboard.js"]
    for relative in required:
        if not (output / relative).is_file():
            errors.append(f"missing file: {relative}")
    for page in pages:
        html = page.read_text(encoding="utf-8")
        checker = PageChecker(page, output, args.base_url, args.catalog_url)
        checker.feed(html)
        errors.extend(checker.errors)
        if args.check_demo_pages and page == output / "index.html":
            for marker in ("虚构演示", "示例数据", "dashboard-data", "content-rows"):
                if marker not in html:
                    errors.append(f"index.html: missing demo marker: {marker}")
    if errors:
        print("\n".join(errors))
        return 1
    print(f"OK: {len(pages)} pages, local links and assets")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
