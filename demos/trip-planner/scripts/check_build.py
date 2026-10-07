"""Check a standalone or integrated Farweek trip-planner build."""

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
    def __init__(self, page: Path, output: Path, base_url: str, catalog_url: str | None):
        super().__init__()
        self.page = page
        self.output = output.resolve()
        self.base = urlsplit(base_url)
        self.prefix = self.base.path.rstrip("/") + "/"
        self.catalog_url = catalog_url
        self.template_urls: set[str] = set()
        self.errors: list[str] = []
        self.catalog_count = 0
        self.main_h1_count = 0
        self.in_main = False
        self.place_count = 0
        self.map_place_count = 0

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
        if tag == "main":
            self.in_main = True
        if tag == "h1" and self.in_main:
            self.main_h1_count += 1
        if "data-place-card" in values:
            self.place_count += 1
        if "data-map-id" in values:
            self.map_place_count += 1
        if tag == "img" and not (values.get("alt") or "").strip():
            self.errors.append(f"{self.page}: image has no alt text")
        if tag == "a" and "data-demo-catalog" in values:
            self.catalog_count += 1
            if self.catalog_url is not None and values.get("href") != self.catalog_url:
                self.errors.append(f"{self.page}: catalog link must point to {self.catalog_url}: {values.get('href')}")
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
                continue
            self.check_url(raw)

    def handle_endtag(self, tag: str) -> None:
        if tag == "main":
            self.in_main = False



class SceneMarkup(HTMLParser):
    """Capture semantic data nodes, including HTML with optional table end tags."""
    VOID = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'}

    def __init__(self):
        super().__init__()
        self.stack = []
        self.nodes = []

    def handle_starttag(self, tag, attrs):
        if tag in {'td', 'th', 'tr', 'option', 'li', 'dt', 'dd'}:
            siblings = {'td', 'th'} if tag in {'td', 'th'} else {'dt', 'dd'} if tag in {'dt', 'dd'} else {tag}
            while self.stack and self.stack[-1]['tag'] in siblings:
                self.stack.pop()
        node = {'tag': tag, 'attrs': dict(attrs), 'text': '', 'ancestors': self.stack.copy()}
        self.nodes.append(node)
        if tag not in self.VOID:
            self.stack.append(node)

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in self.VOID:
            self.handle_endtag(tag)

    def handle_endtag(self, tag):
        for index in range(len(self.stack) - 1, -1, -1):
            if self.stack[index]['tag'] == tag:
                self.stack = self.stack[:index]
                break

    def handle_data(self, data):
        for node in self.stack:
            node['text'] += data

    def find(self, attribute, value=None):
        return [node for node in self.nodes if attribute in node['attrs'] and (value is None or node['attrs'][attribute] == value)]

    def text(self, attribute, value=None):
        nodes = self.find(attribute, value)
        return nodes[0]['text'].strip() if len(nodes) == 1 else None


def load_scene(output, case, allowed):
    import json
    import tomllib
    markup = SceneMarkup()
    markup.feed((output / 'index.html').read_text(encoding='utf-8'))
    body = next((node for node in markup.nodes if node['tag'] == 'body'), None)
    template = body['attrs'].get('data-template') if body else None
    if template not in allowed:
        raise ValueError('missing or unsupported scene template')
    source = Path(__file__).resolve().parent.parent
    if template != 'classic':
        source /= f'variants/{template}'
    home = source / 'content/_index.md'
    settings = tomllib.loads(home.read_text(encoding='utf-8').split('+++', 2)[1])
    basename = 'entries.json' if case == 'dashboard' else 'places.json'
    rows = json.loads((source / 'data' / basename).read_text(encoding='utf-8'))
    embedded = json.loads(markup.text('id', 'dashboard-data' if case == 'dashboard' else 'planner-data') or 'null')
    if embedded != rows:
        raise ValueError('embedded data does not match the selected scene source')
    if body['attrs'].get('data-scene') != settings['sceneLabel']:
        raise ValueError('body scene does not match home content')
    title = next((node['text'].strip() for node in markup.nodes if node['tag'] == 'title' and any(parent['tag'] == 'head' for parent in node['ancestors'])), None)
    if title != settings['siteTitle']:
        raise ValueError('page title does not match home brand')
    return markup, settings, rows


def check_brand_pages(output, settings):
    errors = []
    for page in [output / 'index.html', output / 'about/index.html']:
        html = page.read_text(encoding='utf-8')
        for text in [settings['brandName'], settings['brandEnglish'], settings['dataNotice'], settings['periodLabel']]:
            if text not in html:
                errors.append(f'{page.name}: missing scene brand or disclosure: {text}')
    return errors


def check_scene_data(output):
    import re
    import math
    errors = []
    try:
        markup, settings, places = load_scene(output, 'planner', {'classic', 'journal', 'workbench'})
        if not isinstance(places, list) or len(places) != 8:
            raise ValueError('expected eight scene-specific places')
        ids = set()
        for place in places:
            if not isinstance(place, dict) or not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', place.get('id', '')) or place['id'] in ids:
                raise ValueError('place IDs must be unique lowercase names')
            if any(not isinstance(place.get(key), str) or not place[key].strip() for key in ['name', 'description']) or place.get('category') not in ['自然', '人文', '休憩']:
                raise ValueError('invalid place copy or category')
            if type(place.get('durationMinutes')) is not int or not 0 < place['durationMinutes'] <= 9007199254740991 or type(place.get('costCents')) is not int or not 0 <= place['costCents'] <= 9007199254740991:
                raise ValueError('minutes and cents must be safe integers')
            if any(type(place.get(key)) not in [int, float] or not math.isfinite(place[key]) or not 0 <= place[key] <= 100 for key in ['x', 'y']):
                raise ValueError('place coordinates must be finite and in bounds')
            ids.add(place['id'])
        cards = markup.find('data-place-card')
        pins = markup.find('data-map-id')
        if [node['attrs'].get('data-place-id') for node in cards] != [place['id'] for place in places] or [node['attrs']['data-map-id'] for node in pins] != [place['id'] for place in places]:
            errors.append('index.html: place cards or map IDs disagree with selected scene data')
        for card, pin, place in zip(cards, pins, places):
            if place['name'] not in card['text'] or place['description'] not in card['text'] or str(place['durationMinutes']) not in card['text'] or f"{place['costCents'] / 100:.2f}" not in card['text']:
                errors.append(f"index.html: static place copy or estimates disagree: {place['id']}")
            coordinates = re.fullmatch(r'translate\(\s*([-\d.]+)\s*,\s*([-\d.]+)\s*\)', pin['attrs'].get('transform', ''))
            if not coordinates or not math.isclose(float(coordinates[1]), place['x'] * 8) or not math.isclose(float(coordinates[2]), place['y'] * 5.6):
                errors.append(f"index.html: map position disagrees with data: {place['id']}")
            if place['name'] not in pin['text']:
                errors.append(f"index.html: map label disagrees with data: {place['id']}")
        if markup.text('id', 'map-title') != settings['mapDescription'] or not markup.find('data-map-scene', settings['mapScene']):
            errors.append('index.html: map identity disagrees with home scene')
        for key, value in [('count', '0'), ('stayMinutes', '0'), ('transferMinutes', '0'), ('totalMinutes', '0'), ('costCents', '¥0.00')]:
            if markup.text('data-total', key) != value:
                errors.append(f'index.html: initial {key} total must be empty')
        errors.extend(check_brand_pages(output, settings))
    except (ValueError, TypeError, KeyError, OSError) as error:
        errors.append(f'index.html: scene data validation failed: {error}')
    return errors

def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("output", type=Path)
    parser.add_argument("--base-url", required=True)
    parser.add_argument("--check-demo-pages", action="store_true", help="Require selected-scene pages, places, map coordinates and disclosures")
    parser.add_argument("--catalog-url", help="Allow this exact marked root-relative catalog anchor")
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
    errors: list[str] = []
    required = ["index.html"]
    if args.check_demo_pages:
        required += ["about/index.html", "css/site.css", "js/planner-core.js", "js/planner.js"]
    for relative in required:
        if not (output / relative).is_file():
            errors.append(f"missing file: {relative}")
    pages = sorted(output.rglob("*.html"))
    for page in pages:
        html = page.read_text(encoding="utf-8")
        checker = PageChecker(page, output, args.base_url, args.catalog_url)
        checker.template_urls = set(args.template_url)
        checker.feed(html)
        errors.extend(checker.errors)
        if args.check_demo_pages:
            if checker.main_h1_count != 1:
                errors.append(f"{page}: expected exactly one main h1")
            if args.catalog_url is not None and checker.catalog_count != 1:
                errors.append(f"{page}: expected exactly one marked catalog link")
            for marker in ("虚构演示", "行程规划", "非真实地理导航"):
                if marker not in html:
                    errors.append(f"{page}: missing demo disclosure: {marker}")
            if page == output / "index.html":
                for marker in ("planner-data", "data-trip-planner", "itinerary-list", "itinerary-route"):
                    if marker not in html:
                        errors.append(f"index.html: missing demo marker: {marker}")
                if checker.place_count != 8 or checker.map_place_count != 8:
                    errors.append("index.html: expected eight static places and map markers")
    if args.check_demo_pages and (output / "index.html").is_file():
        errors.extend(check_scene_data(output))
    if errors:
        print("\n".join(errors))
        return 1
    print(f"OK: {len(pages)} pages, trip-planner links, assets and page structure")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
