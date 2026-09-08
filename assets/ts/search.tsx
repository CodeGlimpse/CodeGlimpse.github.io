import { normalizeSearch, matchesSearch } from '../js/search-core.js';

interface PageData {
    title: string;
    description?: string;
    tags?: string[];
    permalink: string;
    content: string;
    image?: string;
}

interface MatchRange {
    start: number;
    end: number;
}

interface TextSegment {
    text: string;
    marked: boolean;
}

interface SearchResult extends PageData {
    matchCount: number;
    previewSegments: TextSegment[];
    titleSegments: TextSegment[];
}

function escapeRegExp(value: string): string {
    return value.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&');
}

function appendSegment(segments: TextSegment[], text: string, marked = false): void {
    if (!text) return;
    const previous = segments[segments.length - 1];
    if (previous?.marked === marked) previous.text += text;
    else segments.push({ text, marked });
}

function processMatches(
    text: string,
    matches: MatchRange[],
    ellipsis = true,
    charLimit = 140,
    offset = 20
): TextSegment[] {
    matches.sort((left, right) => left.start - right.start);
    const segments: TextSegment[] = [];
    let index = 0;
    let lastIndex = 0;
    let characterCount = 0;

    while (index < matches.length) {
        const match = matches[index];
        if (ellipsis && match.start - offset > lastIndex) {
            appendSegment(segments, `${text.substring(lastIndex, lastIndex + offset)} [...] `);
            appendSegment(segments, text.substring(match.start - offset, match.start));
            characterCount += offset * 2;
        } else {
            appendSegment(segments, text.substring(lastIndex, match.start));
            characterCount += match.start - lastIndex;
        }

        let nextIndex = index + 1;
        let end = match.end;
        while (nextIndex < matches.length && matches[nextIndex].start <= end) {
            end = Math.max(matches[nextIndex].end, end);
            nextIndex += 1;
        }

        appendSegment(segments, text.substring(match.start, end), true);
        characterCount += end - match.start;
        index = nextIndex;
        lastIndex = end;
        if (ellipsis && characterCount > charLimit) break;
    }

    if (lastIndex < text.length) {
        const end = ellipsis ? Math.min(text.length, lastIndex + offset) : text.length;
        appendSegment(segments, text.substring(lastIndex, end));
        if (ellipsis && end !== text.length) appendSegment(segments, ' [...]');
    }

    return segments;
}

function appendSegments(parent: HTMLElement, segments: TextSegment[]): void {
    segments.forEach((segment) => {
        if (!segment.marked) {
            parent.append(document.createTextNode(segment.text));
            return;
        }
        const mark = document.createElement('mark');
        mark.textContent = segment.text;
        parent.append(mark);
    });
}

function safeHttpUrl(value: string): string | null {
    try {
        const url = new URL(String(value), window.location.origin);
        return /^https?:$/.test(url.protocol) ? url.toString() : null;
    } catch {
        return null;
    }
}

class Search {
    private data: PageData[];
    private form: HTMLFormElement;
    private input: HTMLInputElement;
    private list: HTMLDivElement;
    private resultTitle: HTMLElement;
    private archive: HTMLElement;
    private results: HTMLElement;
    private clearButton: HTMLButtonElement;
    private en: boolean;
    private requestId = 0;
    private pendingData: Promise<PageData[]> | null = null;
    private composing = false;

    constructor({ form, input, list, resultTitle }) {
        this.form = form;
        this.input = input;
        this.list = list;
        this.resultTitle = resultTitle;
        this.archive = document.getElementById('article-archives');
        this.results = document.getElementById('article-search-results');
        this.clearButton = form.querySelector('[data-article-clear]');
        this.en = form.dataset.lang === 'en';

        this.handleQueryString();
        window.addEventListener('popstate', () => this.handleQueryString());
        this.bindSearchForm();
        this.form.hidden = false;
    }

    private async searchKeywords(keywords: string[]): Promise<SearchResult[]> {
        const rawData = await this.getData();
        const results: SearchResult[] = [];
        const query = keywords.join(' ');
        const pattern = keywords
            .map((keyword) => keyword.trim())
            .filter(Boolean)
            .map(escapeRegExp)
            .join('|');
        if (!pattern) return results;
        const regex = new RegExp(pattern, 'gi');

        for (const item of rawData) {
            if (!matchesSearch([item.title, item.description, ...(item.tags || []), item.content].join(' '), query)) continue;
            const titleMatches = Search.findMatches(item.title, regex);
            const contentMatches = Search.findMatches(item.content, regex);
            const matchCount = titleMatches.length + contentMatches.length;

            results.push({
                ...item,
                matchCount: matchCount + (matchesSearch(item.title, query) ? 10 : 0),
                titleSegments: titleMatches.length
                    ? processMatches(item.title, titleMatches, false)
                    : [{ text: item.title, marked: false }],
                previewSegments: contentMatches.length
                    ? processMatches(item.content, contentMatches)
                    : [{ text: item.content.substring(0, 140), marked: false }]
            });
        }

        return results.sort((left, right) => right.matchCount - left.matchCount);
    }

    private static findMatches(text: string, regex: RegExp): MatchRange[] {
        return Array.from(text.matchAll(regex), (match) => ({
            start: match.index,
            end: match.index + match[0].length
        }));
    }

    private async doSearch(keywords: string[]): Promise<void> {
        const request = ++this.requestId;
        this.clearButton.hidden = !this.input.value;
        this.resultTitle.textContent = this.en ? 'Searching articles…' : '正在查找文章…';
        this.list.replaceChildren();
        this.results.hidden = true;
        this.archive.hidden = false;
        try {
            const results = await this.searchKeywords(keywords);
            if (request !== this.requestId) return;
            results.forEach((item) => this.list.append(Search.render(item)));
            this.archive.hidden = true;
            this.results.hidden = false;
            this.resultTitle.textContent = results.length
                ? (this.en ? results.length + ' articles found' : '找到 ' + results.length + ' 篇文章')
                : (this.en ? 'No matching articles. Try another keyword or clear the search.' : '没有找到匹配的文章，换个关键词或清空搜索试试。');
        } catch {
            if (request !== this.requestId) return;
            this.resultTitle.textContent = this.en
                ? 'Search is unavailable. You can still browse all articles below; try again when connected.'
                : '暂时无法搜索，你仍可浏览下方全部文章，联网后再试。';
        }
    }

    public async getData(): Promise<PageData[]> {
        if (this.data) return this.data;
        if (!this.pendingData) {
            this.pendingData = fetch(this.form.dataset.json)
                .then((response) => {
                    if (!response.ok) throw new Error('Search index unavailable');
                    return response.json();
                }).then((entries) => {
                    if (!Array.isArray(entries)) throw new Error('Invalid search index');
                    this.data = entries.filter(item => item && typeof item.title === 'string' && typeof item.content === 'string' && typeof item.permalink === 'string')
                        .map(item => ({ ...item, tags: Array.isArray(item.tags) ? item.tags.filter(tag => typeof tag === 'string') : [] }));
                    return this.data;
                }).finally(() => { this.pendingData = null; });
        }
        return this.pendingData;
    }

    private bindSearchForm(): void {
        const eventHandler = (event: Event) => {
            event.preventDefault();
            if (this.composing || (event as InputEvent).isComposing) return;
            const keywords = this.input.value.trim();
            Search.updateQueryString(keywords, true);
            if (!keywords) {
                this.clear();
                return;
            }
            this.doSearch(normalizeSearch(keywords).split(' '));
        };
        this.form.addEventListener('submit', eventHandler);
        this.input.addEventListener('input', eventHandler);
        this.input.addEventListener('search', eventHandler);
        this.input.addEventListener('compositionstart', () => { this.composing = true; });
        this.input.addEventListener('compositionend', (event) => { this.composing = false; eventHandler(event); });
        const reset = () => {
            this.input.value = '';
            this.composing = false;
            Search.updateQueryString('', true);
            this.clear();
            this.input.focus();
        };
        this.clearButton.addEventListener('click', reset);
        this.input.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && !this.composing && this.input.value) { event.preventDefault(); reset(); }
        });
    }

    private clear(): void {
        this.requestId += 1;
        this.list.replaceChildren();
        this.results.hidden = true;
        this.archive.hidden = false;
        this.clearButton.hidden = !this.input.value;
        const count = this.archive.querySelectorAll('.article-list--compact article').length;
        this.resultTitle.textContent = this.en ? count + ' articles' : '共 ' + count + ' 篇文章';
    }

    private handleQueryString(): void {
        const keywords = (new URL(window.location.toString()).searchParams.get('keyword') || '').slice(0, 100);
        this.input.value = keywords;
        if (keywords.trim()) this.doSearch(normalizeSearch(keywords).split(' '));
        else this.clear();
    }

    private static updateQueryString(keywords: string, replaceState = false): void {
        const pageUrl = new URL(window.location.toString());
        if (keywords) pageUrl.searchParams.set('keyword', keywords);
        else pageUrl.searchParams.delete('keyword');
        const method = replaceState ? 'replaceState' : 'pushState';
        window.history[method]('', '', pageUrl.toString());
    }

    public static render(item: SearchResult): HTMLElement {
        const article = document.createElement('article');
        const link = document.createElement('a');
        link.href = safeHttpUrl(item.permalink) || '#';

        const details = document.createElement('div');
        details.className = 'article-details';
        const title = document.createElement('h2');
        title.className = 'article-title';
        appendSegments(title, item.titleSegments);
        const preview = document.createElement('section');
        preview.className = 'article-preview';
        appendSegments(preview, item.previewSegments);
        details.append(title, preview);
        link.append(details);

        const imageUrl = item.image ? safeHttpUrl(item.image) : null;
        if (imageUrl) {
            const imageWrapper = document.createElement('div');
            imageWrapper.className = 'article-image';
            const image = document.createElement('img');
            image.src = imageUrl;
            image.loading = 'lazy';
            image.alt = '';
            imageWrapper.append(image);
            link.append(imageWrapper);
        }

        article.append(link);
        return article;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const searchForm = document.querySelector('[data-article-finder]') as HTMLFormElement;
    if (!searchForm) return;
    new Search({
        form: searchForm,
        input: searchForm.querySelector('input') as HTMLInputElement,
        list: document.querySelector('.search-result--list') as HTMLDivElement,
        resultTitle: document.querySelector('#article-results') as HTMLElement
    });
});

export default Search;
