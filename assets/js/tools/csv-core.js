(function (root, factory) {
    const api = factory();

    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    }

    if (root) {
        root.CodeGlimpseCsv = api;
    }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    function normalizeDelimiter(value) {
        const delimiter = value === undefined ? ',' : String(value);
        if (delimiter.length !== 1 || /["\r\n]/.test(delimiter)) {
            throw new RangeError('Delimiter must be one character other than quote or newline');
        }
        return delimiter;
    }

    function parse(input, delimiterValue = ',') {
        const delimiter = normalizeDelimiter(delimiterValue);
        const text = String(input).replace(/^\uFEFF/, '');
        if (text === '') return [];

        const rows = [];
        let row = [];
        let field = '';
        let state = 'start';
        let endedWithRecordBreak = false;

        const pushField = () => {
            row.push(field);
            field = '';
            state = 'start';
        };
        const pushRow = () => {
            pushField();
            rows.push(row);
            row = [];
        };

        for (let index = 0; index < text.length; index += 1) {
            const character = text[index];
            endedWithRecordBreak = false;

            if (state === 'quoted') {
                if (character === '"') {
                    if (text[index + 1] === '"') {
                        field += '"';
                        index += 1;
                    } else {
                        state = 'after-quote';
                    }
                } else if (character === '\r' && text[index + 1] === '\n') {
                    field += '\n';
                    index += 1;
                } else {
                    field += character;
                }
                continue;
            }

            if (state === 'after-quote') {
                if (character === delimiter) {
                    pushField();
                } else if (character === '\r' || character === '\n') {
                    pushRow();
                    if (character === '\r' && text[index + 1] === '\n') index += 1;
                    endedWithRecordBreak = true;
                } else {
                    throw new SyntaxError(`Unexpected character after closing quote at position ${index}`);
                }
                continue;
            }

            if (character === delimiter) {
                pushField();
            } else if (character === '\r' || character === '\n') {
                pushRow();
                if (character === '\r' && text[index + 1] === '\n') index += 1;
                endedWithRecordBreak = true;
            } else if (character === '"') {
                if (state !== 'start' || field !== '') {
                    throw new SyntaxError(`Unexpected quote at position ${index}`);
                }
                state = 'quoted';
            } else {
                field += character;
                state = 'unquoted';
            }
        }

        if (state === 'quoted') throw new SyntaxError('CSV contains an unclosed quoted field');
        if (!endedWithRecordBreak) pushRow();
        return rows;
    }

    function meaningfulRows(rows) {
        return rows.filter((row) => row.some((field) => field !== ''));
    }

    function csvToJson(input, options = {}) {
        const rows = meaningfulRows(parse(input, options.delimiter));
        if (rows.length === 0) return [];
        if (options.header === false) return rows;

        const headers = rows.shift().map((header) => header.trim());
        if (headers.some((header) => !header)) throw new SyntaxError('CSV header names must not be empty');
        if (new Set(headers).size !== headers.length) throw new SyntaxError('CSV header names must be unique');

        return rows.map((row, index) => {
            if (row.length > headers.length) {
                throw new SyntaxError(`CSV row ${index + 2} has more fields than the header`);
            }
            return Object.fromEntries(headers.map((header, column) => [header, row[column] ?? '']));
        });
    }

    function cellValue(value) {
        if (value === null || value === undefined) return '';
        return typeof value === 'object' ? JSON.stringify(value) : String(value);
    }

    function escapeCell(value, delimiter) {
        const text = cellValue(value);
        if (text.includes('"') || text.includes(delimiter) || /[\r\n]/.test(text) || /^\s|\s$/.test(text)) {
            return `"${text.replace(/"/g, '""')}"`;
        }
        return text;
    }

    function serialize(rows, delimiterValue = ',') {
        const delimiter = normalizeDelimiter(delimiterValue);
        return rows.map((row) => {
            if (!Array.isArray(row)) throw new TypeError('CSV rows must be arrays');
            return row.map((value) => escapeCell(value, delimiter)).join(delimiter);
        }).join('\n');
    }

    function parseJsonInput(input) {
        if (typeof input !== 'string') return input;
        try {
            return JSON.parse(input);
        } catch (error) {
            throw new SyntaxError(`Invalid JSON: ${error.message}`);
        }
    }

    function jsonToCsv(input, options = {}) {
        const data = parseJsonInput(input);
        if (!Array.isArray(data)) throw new TypeError('JSON root value must be an array');
        if (data.length === 0) return '';

        const delimiter = normalizeDelimiter(options.delimiter);
        if (data.every((row) => Array.isArray(row))) {
            return serialize(data, delimiter);
        }

        const isObject = (value) => value && typeof value === 'object' && !Array.isArray(value);
        if (!data.every(isObject)) {
            throw new TypeError('JSON array items must all be objects or all be arrays');
        }

        const headers = [];
        const seen = new Set();
        for (const item of data) {
            for (const key of Object.keys(item)) {
                if (!seen.has(key)) {
                    seen.add(key);
                    headers.push(key);
                }
            }
        }
        if (headers.length === 0) return '';

        const rows = data.map((item) => headers.map((header) => item[header]));
        if (options.header !== false) rows.unshift(headers);
        return serialize(rows, delimiter);
    }

    return { csvToJson, jsonToCsv, normalizeDelimiter, parse, serialize };
});
