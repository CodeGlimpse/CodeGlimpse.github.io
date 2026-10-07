"""Check a standalone or integrated dashboard build without a blog dependency."""

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
        self.output = output
        self.base = urlsplit(base_url)
        self.prefix = self.base.path.rstrip("/") + "/"
        self.catalog_url = catalog_url
        self.template_urls: set[str] = set()
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
    import datetime
    import re
    from decimal import Decimal, ROUND_HALF_UP
    errors = []
    try:
        markup, settings, rows = load_scene(output, 'dashboard', {'classic', 'workspace', 'report'})
        if not isinstance(rows, list) or len(rows) != 24:
            raise ValueError('expected 24 scene-specific records')
        ids = set()
        for row in rows:
            if not isinstance(row, dict) or not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', row.get('id', '')) or row['id'] in ids:
                raise ValueError('record IDs must be unique lowercase names')
            if not isinstance(row.get('title'), str) or not row['title'].strip() or not isinstance(row.get('channel'), str) or not row['channel'].strip() or row['channel'] != row['channel'].strip():
                raise ValueError('record title and channel are required')
            if not re.fullmatch(r'\d{4}-\d{2}-\d{2}', row.get('published', '')) or datetime.date.fromisoformat(row['published']).isoformat() != row['published']:
                raise ValueError('record date must be valid ISO format')
            if any(type(row.get(key)) is not int or not 0 <= row[key] <= 9007199254740991 for key in ['views', 'interactions']):
                raise ValueError('record counts must be non-negative safe integers')
            ids.add(row['id'])
        views, interactions = sum(row['views'] for row in rows), sum(row['interactions'] for row in rows)
        if max(views, interactions) > 9007199254740991:
            raise ValueError('summary exceeds safe integer range')
        def rate(view_count, interaction_count):
            value = Decimal(interaction_count) * 100 / Decimal(view_count) if view_count else Decimal(0)
            return str(value.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)) + '%'
        for key, value in [('count', f'{len(rows):,}'), ('views', f'{views:,}'), ('interactions', f'{interactions:,}'), ('rate', rate(views, interactions))]:
            if markup.text('data-metric', key) != value:
                errors.append(f'index.html: {key} metric disagrees with data')
        table = markup.find('data-entry-id')
        expected = sorted(rows, key=lambda row: row['views'], reverse=True)
        if [node['attrs']['data-entry-id'] for node in table] != [row['id'] for row in expected]:
            errors.append('index.html: table order or IDs disagree with data')
        for node, row in zip(table, expected):
            cells = {cell['attrs']['data-cell']: cell['text'].strip() for cell in markup.find('data-cell') if node in cell['ancestors']}
            actual = {key: row[key] for key in ['title', 'published', 'channel']}
            actual.update(views=f"{row['views']:,}", interactions=f"{row['interactions']:,}", rate=rate(row['views'], row['interactions']))
            if cells != actual:
                errors.append(f"index.html: table cells disagree with record {row['id']}")
        channels = list(dict.fromkeys(row['channel'] for row in rows))
        months = sorted(set(row['published'][:7] for row in rows))
        for control, values in [('month-filter', months), ('channel-filter', channels)]:
            select = markup.find('id', control)
            options = [node['attrs'].get('value') for node in markup.nodes if node['tag'] == 'option' and select and select[0] in node['ancestors']]
            if options != ['all'] + values:
                errors.append(f'index.html: {control} choices disagree with current data')
        chart = markup.find('data-channel')
        if [node['attrs']['data-channel'] for node in chart] != channels:
            errors.append('index.html: chart channel domain disagrees with data')
        for node in chart:
            total = next((child['text'].strip() for child in markup.nodes if 'channel-total' in child['attrs'].get('class', '').split() and node in child['ancestors']), None)
            value = sum(row['views'] for row in rows if row['channel'] == node['attrs']['data-channel'])
            if total != f'{value:,}':
                errors.append('index.html: chart total disagrees with data')
        columns = markup.find('data-month')
        template = markup.find('data-template')[0]['attrs']['data-template']
        if template != 'classic' and [node['attrs']['data-month'] for node in columns] != months:
            errors.append('index.html: month chart domain disagrees with data')
        for node in columns:
            subset = [row for row in rows if row['published'].startswith(node['attrs']['data-month'])]
            for attr, value in [('data-monthly-views', f"{sum(row['views'] for row in subset):,}"), ('data-monthly-count', str(len(subset)))]:
                text = next((child['text'].strip() for child in markup.find(attr) if node in child['ancestors']), None)
                if text != value:
                    errors.append('index.html: month chart values disagree with data')
        errors.extend(check_brand_pages(output, settings))
    except (ValueError, TypeError, KeyError, OSError) as error:
        errors.append(f'index.html: scene data validation failed: {error}')
    return errors

def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("output", type=Path)
    parser.add_argument("--base-url", required=True)
    parser.add_argument("--check-demo-pages", action="store_true", help="Require selected-scene pages, data, scripts and disclosure")
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
        checker.template_urls = set(args.template_url)
        checker.feed(html)
        errors.extend(checker.errors)
        if args.check_demo_pages and page == output / "index.html":
            for marker in ("虚构演示", "示例数据", "dashboard-data", "content-rows"):
                if marker not in html:
                    errors.append(f"index.html: missing demo marker: {marker}")
    if args.check_demo_pages and (output / "index.html").is_file():
        errors.extend(check_scene_data(output))
    if errors:
        print("\n".join(errors))
        return 1
    print(f"OK: {len(pages)} pages, local links and assets")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
