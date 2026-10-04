"""Check rendered links, image descriptions, and small previews in a Hugo build."""

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


def valid_photo_url(value: str | None) -> bool:
    if not value or "\\" in value or any(char.isspace() or ord(char) < 32 or 127 <= ord(char) <= 159 for char in value):
        return False
    try:
        parsed = urlsplit(value)
        # Reading the port also rejects malformed or out-of-range authorities.
        _ = parsed.port
        return parsed.scheme == "https" and bool(parsed.hostname)
    except ValueError:
        return False


class PageChecker(HTMLParser):
    def __init__(self, page: Path, output: Path, prefix: str, catalog_url: str | None = None) -> None:
        super().__init__()
        self.page = page
        self.output = output
        self.prefix = prefix
        self.catalog_url = catalog_url
        self.template_urls: set[str] = set()
        self.photo_links: dict[str, list[str | None]] = {"data-photo-source": [], "data-photo-license": []}
        self.errors: list[str] = []

    def check_url(self, raw: str) -> None:
        if not raw or raw.startswith(("#", "data:", "mailto:", "tel:")):
            return
        try:
            parsed = urlsplit(raw)
        except ValueError:
            self.errors.append(f"{self.page}: invalid URL: {raw}")
            return
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
        target = target.resolve()
        if not target.is_relative_to(self.output):
            self.errors.append(f"{self.page}: local target escapes site output: {raw}")
            return
        if not target.is_file():
            self.errors.append(f"{self.page}: missing local target: {raw}")

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
        if tag == "a":
            for marker in self.photo_links:
                if marker in values:
                    self.photo_links[marker].append(values.get("href"))
        if tag == "img" and not (values.get("alt") or "").strip():
            self.errors.append(f"{self.page}: image lacks meaningful alt text")
        for attribute in ("href", "src"):
            raw = values.get(attribute)
            if tag == "a" and attribute == "href" and "data-demo-template" in values and self.template_urls:
                if raw not in self.template_urls:
                    self.errors.append(f"{self.page}: template link must point to an allowed URL: {raw}")
                    continue
                if "data-demo-catalog" not in values or self.catalog_url is None:
                    continue
            if values.get(attribute):
                if tag == "a" and attribute == "href" and "data-demo-catalog" in values and self.catalog_url is not None:
                    if values[attribute] != self.catalog_url:
                        self.errors.append(f"{self.page}: catalog link must point to {self.catalog_url}: {values[attribute]}")
                    continue
                self.check_url(values[attribute] or "")
        if values.get("srcset"):
            for entry in (values["srcset"] or "").split(","):
                self.check_url(entry.strip().split()[0])


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("output", type=Path)
    parser.add_argument("--base-url", required=True)
    parser.add_argument("--check-demo-pages", action="store_true", help="Also require photography demo disclosures and source/license credits")
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

    for relative in ("index.html", "works/index.html", "about/index.html"):
        if not (output / relative).is_file():
            errors.append(f"missing page: {relative}")
    work_pages = sorted((output / "works").glob("*/index.html"))
    if not work_pages:
        errors.append("no work detail pages")

    home = output / "index.html"
    if args.check_demo_pages and home.is_file():
        home_text = home.read_text(encoding="utf-8")
        for notice in ("摄影专题演示", "真实摄影作品"):
            if notice not in home_text:
                errors.append(f"home page missing disclosure: {notice}")

    pages = sorted(output.rglob("*.html"))
    for page in pages:
        checker = PageChecker(page, output, prefix, args.catalog_url)
        checker.template_urls = set(args.template_url)
        checker.feed(page.read_text(encoding="utf-8"))
        errors.extend(checker.errors)
        if args.check_demo_pages and page in work_pages:
            for marker, label in (("data-photo-source", "source"), ("data-photo-license", "license")):
                links = checker.photo_links[marker]
                if not links:
                    errors.append(f"{page}: missing photo {label} link ({marker})")
                elif any(not valid_photo_url(link) for link in links):
                    errors.append(f"{page}: photo {label} link ({marker}) must use a non-empty HTTPS URL")

    preview_files = sorted((output / "previews").glob("*.jpg"))
    if len(preview_files) < len(work_pages):
        errors.append("fewer generated JPEG previews than work detail pages")
    for preview in preview_files:
        if preview.stat().st_size <= 0:
            errors.append(f"empty preview: {preview}")

    if errors:
        print("\n".join(errors))
        return 1
    print(f"OK: {len(pages)} HTML pages, {len(work_pages)} works, {len(preview_files)} previews, local links and alt text")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
