interface PageData {
    title: string;
    date: string;
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
    private resultTitle: HTMLHeadingElement;
    private resultTitleTemplate: string;

    constructor({ form, input, list, resultTitle, resultTitleTemplate }) {
        this.form = form;
        this.input = input;
        this.list = list;
        this.resultTitle = resultTitle;
        this.resultTitleTemplate = resultTitleTemplate;

        if (this.input.value.trim() !== '') this.doSearch(this.input.value.split(' '));
        else this.handleQueryString();

        this.bindQueryStringChange();
        this.bindSearchForm();
    }

    private async searchKeywords(keywords: string[]): Promise<SearchResult[]> {
        const rawData = await this.getData();
        const results: SearchResult[] = [];
        const pattern = keywords
            .map((keyword) => keyword.trim())
            .filter(Boolean)
            .map(escapeRegExp)
            .join('|');
        if (!pattern) return results;
        const regex = new RegExp(pattern, 'gi');

        for (const item of rawData) {
            const titleMatches = Search.findMatches(item.title, regex);
            const contentMatches = Search.findMatches(item.content, regex);
            const matchCount = titleMatches.length + contentMatches.length;
            if (!matchCount) continue;

            results.push({
                ...item,
                matchCount,
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
        const startTime = performance.now();
        const results = await this.searchKeywords(keywords);
        this.clear();
        results.forEach((item) => this.list.append(Search.render(item)));
        const seconds = ((performance.now() - startTime) / 1000).toPrecision(1);
        this.resultTitle.textContent = this.generateResultTitle(results.length, seconds);
    }

    private generateResultTitle(resultLength: number, seconds: string): string {
        return this.resultTitleTemplate
            .replace('#PAGES_COUNT', String(resultLength))
            .replace('#TIME_SECONDS', seconds);
    }

    public async getData(): Promise<PageData[]> {
        if (!this.data) {
            const jsonUrl = this.form.dataset.json;
            this.data = await fetch(jsonUrl).then((response) => response.json());
            const parser = new DOMParser();
            this.data.forEach((item) => {
                item.content = parser.parseFromString(item.content, 'text/html').body.textContent || '';
            });
        }
        return this.data;
    }

    private bindSearchForm(): void {
        let lastSearch = '';
        const eventHandler = (event: Event) => {
            event.preventDefault();
            const keywords = this.input.value.trim();
            Search.updateQueryString(keywords, true);
            if (!keywords) {
                lastSearch = '';
                this.clear();
                return;
            }
            if (lastSearch === keywords) return;
            lastSearch = keywords;
            this.doSearch(keywords.split(' '));
        };
        this.input.addEventListener('input', eventHandler);
        this.input.addEventListener('compositionend', eventHandler);
    }

    private clear(): void {
        this.list.replaceChildren();
        this.resultTitle.textContent = '';
    }

    private bindQueryStringChange(): void {
        window.addEventListener('popstate', () => this.handleQueryString());
    }

    private handleQueryString(): void {
        const keywords = new URL(window.location.toString()).searchParams.get('keyword') || '';
        this.input.value = keywords;
        if (keywords) this.doSearch(keywords.split(' '));
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

declare global {
    interface Window {
        searchResultTitleTemplate: string;
    }
}

window.addEventListener('load', () => {
    window.setTimeout(() => {
        const searchForm = document.querySelector('.search-form') as HTMLFormElement;
        if (!searchForm) return;
        new Search({
            form: searchForm,
            input: searchForm.querySelector('input') as HTMLInputElement,
            list: document.querySelector('.search-result--list') as HTMLDivElement,
            resultTitle: document.querySelector('.search-result--title') as HTMLHeadingElement,
            resultTitleTemplate: window.searchResultTitleTemplate
        });
    }, 0);
});

export default Search;
