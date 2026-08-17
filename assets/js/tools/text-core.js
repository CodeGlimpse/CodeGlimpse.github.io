(function (root, factory) {
    const api = factory();

    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    }

    if (root) {
        root.CodeGlimpseText = api;
    }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    const TRANSFORMS = Object.freeze([
        'upper',
        'lower',
        'title',
        'sentence',
        'trim-lines',
        'collapse-whitespace'
    ]);

    function countWords(text, locale) {
        if (typeof Intl?.Segmenter === 'function') {
            const segmenter = new Intl.Segmenter(locale || undefined, { granularity: 'word' });
            return Array.from(segmenter.segment(text)).filter((segment) => segment.isWordLike).length;
        }
        return (text.match(/[\p{L}\p{N}_]+(?:['-][\p{L}\p{N}_]+)*/gu) ?? []).length;
    }

    function utf8ByteLength(text) {
        let length = 0;
        for (const character of text) {
            const codePoint = character.codePointAt(0);
            if (codePoint <= 0x7f) length += 1;
            else if (codePoint <= 0x7ff) length += 2;
            else if (codePoint <= 0xffff) length += 3;
            else length += 4;
        }
        return length;
    }

    function analyze(input, locale) {
        const text = String(input);
        return {
            bytes: utf8ByteLength(text),
            characters: Array.from(text).length,
            charactersNoSpaces: Array.from(text).filter((character) => !/\s/u.test(character)).length,
            lines: text === '' ? 0 : text.split(/\r\n|\r|\n/).length,
            words: countWords(text, locale)
        };
    }

    function titleCase(text, locale) {
        return text.toLocaleLowerCase(locale || undefined).replace(
            /[\p{L}\p{N}][\p{L}\p{M}\p{N}'-]*/gu,
            (word) => {
                const characters = Array.from(word);
                return `${characters[0].toLocaleUpperCase(locale || undefined)}${characters.slice(1).join('')}`;
            }
        );
    }

    function sentenceCase(text, locale) {
        const lower = text.toLocaleLowerCase(locale || undefined);
        return lower.replace(/(^|[.!?\u3002\uFF01\uFF1F]\s*)(\p{L})/gu, (match, prefix, letter) => (
            `${prefix}${letter.toLocaleUpperCase(locale || undefined)}`
        ));
    }

    function transform(input, mode, locale) {
        const text = String(input);
        if (!TRANSFORMS.includes(mode)) throw new RangeError(`Unsupported text transform: ${mode}`);

        if (mode === 'upper') return text.toLocaleUpperCase(locale || undefined);
        if (mode === 'lower') return text.toLocaleLowerCase(locale || undefined);
        if (mode === 'title') return titleCase(text, locale);
        if (mode === 'sentence') return sentenceCase(text, locale);
        if (mode === 'trim-lines') {
            return text.split(/\r\n|\r|\n/).map((line) => line.trim()).join('\n').trim();
        }
        return text.trim().split(/\r\n|\r|\n/)
            .map((line) => line.trim().replace(/[^\S\r\n]+/g, ' '))
            .join('\n')
            .replace(/\n{3,}/g, '\n\n');
    }

    return { TRANSFORMS, analyze, countWords, transform, utf8ByteLength };
});
