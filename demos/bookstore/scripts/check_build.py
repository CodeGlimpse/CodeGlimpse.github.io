"""Check a standalone or integrated bookstore build without a parent site."""

from __future__ import annotations

import argparse
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit


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
    def __init__(self, page: Path, output: Path, base_url: str, catalog_url: str | None, demo: bool):
        super().__init__()
        self.page = page
        self.output = output
        self.base = urlsplit(base_url)
        self.prefix = unquote(self.base.path).rstrip("/") + "/"
        self.catalog_url = catalog_url
        self.template_urls: set[str] = set()
        self.demo = demo
        self.errors: list[str] = []
        self.main_count = 0
        self.in_main = False
        self.main_class = False
        self.main_h1_count = 0
        self.anchors: list[dict[str, str | None]] = []
        self.catalog_count = 0
        self.catalog_text: list[str] = []
        self.in_catalog = False
        self.book_count = 0

    def check_url(self, raw: str) -> None:
        if not raw or raw.startswith(("#", "mailto:", "data:")):
            return
        try:
            parsed = urlsplit(raw)
        except ValueError:
            self.errors.append(f"{self.page}: invalid URL: {raw}")
            return
        if parsed.scheme and parsed.scheme not in ("http", "https"):
            self.errors.append(f"{self.page}: unsupported URL scheme: {raw}")
            return
        if (parsed.scheme and parsed.scheme != self.base.scheme) or (parsed.netloc and parsed.netloc != self.base.netloc):
            return
        pathname = unquote(parsed.path)
        if "\\" in pathname or "\x00" in pathname:
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
        if tag == "main":
            self.main_count += 1
            self.in_main = True
            self.main_class = "main" in (values.get("class") or "").split()
        if tag == "h1" and self.in_main:
            self.main_h1_count += 1
        if tag == "article" and "data-book-id" in values:
            self.book_count += 1
        if tag == "a":
            self.anchors.append(values)
            if "data-demo-catalog" in values:
                self.catalog_count += 1
                self.in_catalog = True
        if tag == "img" and not values.get("alt"):
            self.errors.append(f"{self.page}: image has no alt text")
        for attribute in ("href", "src"):
            raw = values.get(attribute)
            if tag == "a" and attribute == "href" and "data-demo-template" in values and self.template_urls:
                if raw not in self.template_urls:
                    self.errors.append(f"{self.page}: template link must point to an allowed URL: {raw}")
                    continue
                if "data-demo-catalog" not in values or self.catalog_url is None:
                    continue
            if not raw:
                continue
            if tag == "a" and attribute == "href" and "data-demo-catalog" in values and self.catalog_url is not None:
                if raw != self.catalog_url:
                    self.errors.append(f"{self.page}: catalog link must point to {self.catalog_url}: {raw}")
                continue
            try:
                parsed = urlsplit(raw)
            except ValueError:
                self.errors.append(f"{self.page}: invalid URL: {raw}")
                continue
            external = (parsed.scheme and parsed.scheme != self.base.scheme) or (parsed.netloc and parsed.netloc != self.base.netloc)
            if self.demo and external and (attribute == "src" or (tag == "link" and values.get("rel") == "stylesheet")):
                self.errors.append(f"{self.page}: demo asset must be local: {raw}")
                continue
            self.check_url(raw)

    def handle_endtag(self, tag: str) -> None:
        if tag == "main":
            self.in_main = False
        if tag == "a":
            self.in_catalog = False

    def handle_data(self, data: str) -> None:
        if self.in_catalog:
            self.catalog_text.append(data)

    def finish(self) -> None:
        if not self.demo:
            return
        if self.main_count != 1 or not self.main_class or self.main_h1_count != 1:
            self.errors.append(f"{self.page}: require one main.main and one h1 inside main")
        if not self.anchors or "skip-link" not in (self.anchors[0].get("class") or "").split() or self.anchors[0].get("href") != "#main":
            self.errors.append(f"{self.page}: first anchor must be the skip link")
        if self.catalog_url is not None:
            if self.catalog_count != 1 or len(self.anchors) < 2 or "data-demo-catalog" not in self.anchors[1]:
                self.errors.append(f"{self.page}: require one catalog anchor immediately after the skip link")
            if "".join(self.catalog_text).strip() != "← 返回演示目录":
                self.errors.append(f"{self.page}: catalog anchor text must be exact")


def valid_directory_path(value: str) -> bool:
    try:
        parsed = urlsplit(value)
    except ValueError:
        return False
    decoded = unquote(parsed.path)
    return (not parsed.scheme and not parsed.netloc and parsed.path == value
            and value.startswith("/") and value.endswith("/") and "\\" not in decoded and "\x00" not in decoded
            and not any(part in (".", "..") for part in decoded.split("/")))


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("output", type=Path)
    parser.add_argument("--base-url", required=True)
    parser.add_argument("--check-demo-pages", action="store_true", help="Require bookstore pages, local assets, accessible headings and demo disclosure")
    parser.add_argument("--catalog-url", help="Allow only this exact marked root-relative catalog anchor")
    parser.add_argument("--template-url", action="append", default=[], help="Allow a marked template link to this exact root-relative directory path")
    args = parser.parse_args()
    for template_url in args.template_url:
        if not valid_template_url(template_url):
            parser.error("--template-url must be an exact root-relative directory path")
    base = urlsplit(args.base_url)
    if base.scheme not in ("http", "https") or not base.netloc or base.query or base.fragment or not valid_directory_path(base.path or "/"):
        parser.error("--base-url must be an absolute HTTP(S) directory URL without path traversal")
    if args.catalog_url is not None and not valid_directory_path(args.catalog_url):
        parser.error("--catalog-url must be an exact root-relative directory path")

    output = args.output.resolve()
    pages = sorted(output.rglob("*.html"))
    errors: list[str] = []
    required = ["index.html"]
    if args.check_demo_pages:
        required += ["about/index.html", "css/site.css", "js/store-core.js", "js/store.js", "favicon.svg"]
    for relative in required:
        target = (output / relative).resolve()
        if not target.is_relative_to(output) or not target.is_file():
            errors.append(f"missing or escaping file: {relative}")
    for page in pages:
        if not page.resolve().is_relative_to(output):
            errors.append(f"HTML page escapes site output: {page}")
            continue
        html = page.read_text(encoding="utf-8")
        checker = PageChecker(page, output, args.base_url, args.catalog_url, args.check_demo_pages)
        checker.template_urls = set(args.template_url)
        checker.feed(html)
        checker.finish()
        errors.extend(checker.errors)
        if args.check_demo_pages and page in (output / "index.html", output / "about/index.html"):
            for marker in ("虚构演示", "模拟购物袋"):
                if marker not in html:
                    errors.append(f"{page}: missing demo marker: {marker}")
        if args.check_demo_pages and page == output / "index.html":
            for marker in ("bookstore-data", "book-grid", "bag-lines", "bag-subtotal"):
                if marker not in html:
                    errors.append(f"index.html: missing bookstore marker: {marker}")
            if checker.book_count != 12:
                errors.append("index.html: require all 12 static fictional books")
    if errors:
        print("\n".join(errors))
        return 1
    print(f"OK: {len(pages)} pages, local links, bookstore assets and disclosure")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
