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

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
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


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("output", type=Path, help="Hugo output directory")
    parser.add_argument("--base-url", required=True, help="Base URL used for this Hugo build")
    parser.add_argument("--check-demo-pages", action="store_true", help="Also require the original demo pages")
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
        errors.extend(checker.errors)

    if errors:
        print("\n".join(errors))
        return 1
    print(f"OK: {len(list(output.rglob('*.html')))} pages, local links and image descriptions")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
