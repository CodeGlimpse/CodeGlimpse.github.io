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


class PageChecker(HTMLParser):
    def __init__(self, page: Path, output: Path, prefix: str) -> None:
        super().__init__()
        self.page = page
        self.output = output
        self.prefix = prefix
        self.errors: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
        if tag == "img" and not values.get("alt"):
            self.errors.append(f"{self.page}: image has no alt text")
        for attr in ("href", "src"):
            raw = values.get(attr)
            if not raw or raw.startswith(("#", "mailto:", "data:")):
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
            if not target.is_file():
                self.errors.append(f"{self.page}: missing local target: {raw}")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("output", type=Path, help="Hugo output directory")
    parser.add_argument("--base-url", required=True, help="Base URL used for this Hugo build")
    parser.add_argument("--check-demo-pages", action="store_true", help="Also require the original demo pages")
    args = parser.parse_args()
    output = args.output.resolve()
    base_path = urlsplit(args.base_url).path.strip("/")
    prefix = f"/{base_path}/" if base_path else "/"
    errors: list[str] = []

    if args.check_demo_pages:
        for relative in REQUIRED_PAGES:
            if not (output / relative).is_file():
                errors.append(f"missing page: {relative}")
    for page in output.rglob("*.html"):
        checker = PageChecker(page, output, prefix)
        checker.feed(page.read_text(encoding="utf-8"))
        errors.extend(checker.errors)

    if errors:
        print("\n".join(errors))
        return 1
    print(f"OK: {len(list(output.rglob('*.html')))} pages, local links and image descriptions")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
