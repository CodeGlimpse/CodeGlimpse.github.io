"""Check a standalone or integrated workshop build without a main-site dependency."""

from __future__ import annotations

import argparse
import json
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
    def __init__(self, page: Path, output: Path, base_url: str, catalog_url: str | None, demo: bool = False):
        super().__init__()
        self.page = page
        self.output = output
        self.base = urlsplit(base_url)
        self.prefix = self.base.path.rstrip("/") + "/"
        self.catalog_url = catalog_url
        self.template_urls: set[str] = set()
        self.demo = demo
        self.errors: list[str] = []
        self.main_depth = 0
        self.main_count = 0
        self.main_h1_count = 0
        self.first_focusable: tuple[str, dict[str, str | None]] | None = None
        self.catalog_text: list[str] | None = None
        self.catalog_count = 0
        self.data_text: list[str] = []
        self.in_booking_data = False
        self.course_ids: list[str] = []
        self.session_ids: list[str] = []
        self.deferred_scripts: set[str] = set()
        self.template = "classic"
        self.current_course: str | None = None
        self.current_session: str | None = None
        self.course_text: dict[str, list[str]] = {}
        self.session_text: dict[str, list[str]] = {}
        self.session_times: dict[str, list[str]] = {}

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
        if tag == "body":
            self.template = values.get("data-template") or "classic"
        if tag == "main":
            self.main_depth += 1
            self.main_count += 1
        if tag == "h1" and self.main_depth:
            self.main_h1_count += 1
        if self.first_focusable is None and "disabled" not in values and (
            (tag == "a" and values.get("href")) or tag in ("button", "select", "input", "textarea")
        ):
            self.first_focusable = (tag, values)
        if tag == "img" and not values.get("alt"):
            self.errors.append(f"{self.page}: image has no alt text")
        if tag == "a" and "data-demo-catalog" in values:
            self.catalog_count += 1
            self.catalog_text = []
        if tag == "button" and values.get("data-course-id"):
            self.course_ids.append(values["data-course-id"])
            self.current_course = values["data-course-id"]
            self.course_text[self.current_course] = []
        if tag == "li" and values.get("data-session-id"):
            self.session_ids.append(values["data-session-id"])
            self.current_session = values["data-session-id"]
            self.session_text[self.current_session] = []
            self.session_times[self.current_session] = []
        if tag == "time" and self.current_session:
            self.session_times[self.current_session].append(values.get("datetime") or "")
        if tag == "script":
            self.in_booking_data = values.get("id") == "booking-data" and values.get("type") == "application/json"
            if values.get("src") and "defer" in values:
                self.deferred_scripts.add(urlsplit(values["src"]).path.rsplit("/", 1)[-1])
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
            self.check_url(raw)

    def handle_endtag(self, tag: str) -> None:
        if tag == "button":
            self.current_course = None
        if tag == "li":
            self.current_session = None
        if tag == "main":
            self.main_depth = max(0, self.main_depth - 1)
        if tag == "a" and self.catalog_text is not None:
            if self.demo and "".join(self.catalog_text).strip() != "← 返回演示目录":
                self.errors.append(f"{self.page}: catalog anchor must say ← 返回演示目录")
            self.catalog_text = None
        if tag == "script":
            self.in_booking_data = False

    def handle_data(self, data: str) -> None:
        if self.current_course:
            self.course_text[self.current_course].append(data)
        if self.current_session:
            self.session_text[self.current_session].append(data)
        if self.catalog_text is not None:
            self.catalog_text.append(data)
        if self.in_booking_data:
            self.data_text.append(data)

    def check_demo_page(self, html: str, is_home: bool) -> None:
        if self.main_count != 1 or self.main_h1_count != 1:
            self.errors.append(f"{self.page}: require one main and one h1 inside main")
        if self.first_focusable is None or self.first_focusable[0] != "a" or "skip-link" not in (self.first_focusable[1].get("class") or "").split():
            self.errors.append(f"{self.page}: skip link must be the first focusable element")
        if "虚构演示 · 预约预览" not in html:
            self.errors.append(f"{self.page}: missing fictional preview disclosure")
        if self.catalog_url is not None and self.catalog_count != 1:
            self.errors.append(f"{self.page}: require one marked catalog anchor")
        if not is_home:
            return
        for marker in ("booking-data", "session-list", "预约单预览", "固定示例", "不会提交信息", "noscript-note"):
            if marker not in html:
                self.errors.append(f"{self.page}: missing demo marker: {marker}")
        if self.deferred_scripts != {"booking-core.js", "booking.js"}:
            self.errors.append(f"{self.page}: require both deferred local booking scripts")
        try:
            data = json.loads("".join(self.data_text))
            course_ids = [course["id"] for course in data["courses"]]
            session_ids = [session["id"] for session in data["sessions"]]
            if len(course_ids) != 6 or len(session_ids) != 12 or sorted(course_ids) != sorted(self.course_ids) or sorted(session_ids) != sorted(self.session_ids):
                self.errors.append(f"{self.page}: static courses and sessions must match the complete embedded schedule")
            if self.template not in ("classic", "calendar", "agenda"):
                raise ValueError("unsupported workshop scene")
            source = Path(__file__).resolve().parents[1]
            folder = source if self.template == "classic" else source / "variants" / self.template
            if data != json.loads((folder / "data/schedule.json").read_text(encoding="utf-8")):
                raise ValueError("embedded schedule must match the selected scene data")
            if len(set(course_ids)) != 6 or len(set(session_ids)) != 12:
                raise ValueError("duplicate course or session IDs")
            for course in data["courses"]:
                text = " ".join("".join(self.course_text[course["id"]]).split())
                cents = course["priceCents"]
                if not isinstance(cents, int) or isinstance(cents, bool) or cents < 0 or cents * 6 > 9007199254740991:
                    raise ValueError("unsafe integer-cent price")
                fields = [course["title"], course["category"], course["description"], course["materials"],
                          course["level"], f"¥{cents // 100}.{cents % 100:02d}", f"{course['durationMinutes']} 分钟"]
                if any(field not in text for field in fields):
                    raise ValueError(f"incomplete static course: {course['id']}")
            for session in data["sessions"]:
                remaining = session["remaining"]
                if not isinstance(remaining, int) or isinstance(remaining, bool) or not 0 <= remaining <= 6:
                    raise ValueError("invalid bounded capacity")
                text = " ".join("".join(self.session_text[session["id"]]).split())
                course = next(course for course in data["courses"] if course["id"] == session["courseId"])
                if course["title"] not in text or f"示例余位 {remaining} 人" not in text:
                    raise ValueError(f"incomplete static session: {session['id']}")
                expected_times = [f"{session['date']}T{session[key]}:00" for key in ("start", "end")]
                if self.session_times[session["id"]] != expected_times or not session["date"].startswith(data["month"] + "-"):
                    raise ValueError(f"session dates and times must match source: {session['id']}")
        except (ValueError, KeyError, TypeError, OSError, StopIteration):
            self.errors.append(f"{self.page}: missing, incomplete or invalid application/json booking data")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("output", type=Path)
    parser.add_argument("--base-url", required=True)
    parser.add_argument("--check-demo-pages", action="store_true", help="Require workshop pages, local assets, full schedule and preview disclosure")
    parser.add_argument("--catalog-url", help="Allow only this exact marked root-relative catalog anchor")
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
    pages = sorted(output.rglob("*.html"))
    errors: list[str] = []
    required = ["index.html"]
    if args.check_demo_pages:
        required += ["about/index.html", "css/site.css", "js/booking-core.js", "js/booking.js", "favicon.svg"]
    for relative in required:
        if not (output / relative).is_file():
            errors.append(f"missing file: {relative}")
    for page in pages:
        html = page.read_text(encoding="utf-8")
        checker = PageChecker(page, output, args.base_url, args.catalog_url, args.check_demo_pages)
        checker.template_urls = set(args.template_url)
        checker.feed(html)
        if args.check_demo_pages:
            checker.check_demo_page(html, page == output / "index.html")
        errors.extend(checker.errors)
    if errors:
        print("\n".join(errors))
        return 1
    print(f"OK: {len(pages)} pages, local links and assets")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
