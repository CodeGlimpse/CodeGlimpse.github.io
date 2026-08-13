(function (root, factory) {
    const api = factory();

    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    }

    if (root) {
        root.CodeGlimpseTime = api;
    }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    const FALLBACK_TIMEZONES = [
        'UTC',
        'Asia/Shanghai',
        'Asia/Tokyo',
        'Asia/Singapore',
        'Asia/Kolkata',
        'Europe/London',
        'Europe/Paris',
        'Europe/Berlin',
        'America/New_York',
        'America/Chicago',
        'America/Denver',
        'America/Los_Angeles',
        'Australia/Sydney',
        'Pacific/Auckland'
    ];

    function getTimezones() {
        if (typeof Intl.supportedValuesOf === 'function') {
            return Intl.supportedValuesOf('timeZone');
        }
        const local = Intl.DateTimeFormat().resolvedOptions().timeZone;
        return Array.from(new Set([local, ...FALLBACK_TIMEZONES].filter(Boolean)));
    }

    function parseTimestamp(value) {
        const text = String(value).trim();
        if (!/^[+-]?\d+$/.test(text)) {
            throw new SyntaxError('Timestamp must be an integer');
        }

        const numericValue = Number(text);
        if (!Number.isSafeInteger(numericValue)) {
            throw new RangeError('Timestamp is outside the safe integer range');
        }

        const digits = Math.abs(numericValue).toString().length;
        const unit = digits <= 11 ? 'seconds' : 'milliseconds';
        const milliseconds = unit === 'seconds' ? numericValue * 1000 : numericValue;
        if (!Number.isSafeInteger(milliseconds)) {
            throw new RangeError('Timestamp is outside the safe integer range');
        }

        const date = new Date(milliseconds);
        if (Number.isNaN(date.getTime())) throw new RangeError('Timestamp is outside the Date range');
        return { date, milliseconds, unit };
    }

    function createUtcDate(year, month, day, hour, minute, second) {
        const date = new Date(0);
        date.setUTCFullYear(year, month - 1, day);
        date.setUTCHours(hour, minute, second, 0);
        return date;
    }

    function parseDateTime(value) {
        const text = String(value).trim();
        const match = text.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})$/);
        if (!match) throw new SyntaxError('Date time must use YYYY-MM-DD HH:mm:ss');

        const parts = match.slice(1).map(Number);
        const [year, month, day, hour, minute, second] = parts;
        if (month < 1 || month > 12 || hour > 23 || minute > 59 || second > 59) {
            throw new RangeError('Date time contains an invalid component');
        }

        const date = createUtcDate(year, month, day, hour, minute, second);
        if (
            date.getUTCFullYear() !== year ||
            date.getUTCMonth() !== month - 1 ||
            date.getUTCDate() !== day ||
            date.getUTCHours() !== hour ||
            date.getUTCMinutes() !== minute ||
            date.getUTCSeconds() !== second
        ) {
            throw new RangeError('Date time contains an invalid calendar date');
        }
        return { year, month, day, hour, minute, second };
    }

    function getOffsetMinutes(date, timeZone) {
        const parts = new Intl.DateTimeFormat('en-US', {
            timeZone,
            timeZoneName: 'longOffset'
        }).formatToParts(date);
        const offsetName = parts.find(part => part.type === 'timeZoneName')?.value || 'GMT';
        const match = offsetName.match(/^GMT([+-])(\d{1,2})(?::?(\d{2}))?$/);
        if (!match) return 0;
        const minutes = Number(match[2]) * 60 + Number(match[3] || 0);
        return (match[1] === '+' ? 1 : -1) * minutes;
    }

    function dateTimeToTimestamp(value, timeZone) {
        const parts = parseDateTime(value);
        const naiveUtc = createUtcDate(
            parts.year,
            parts.month,
            parts.day,
            parts.hour,
            parts.minute,
            parts.second
        ).getTime();
        let timestamp = naiveUtc;

        // Recalculate once after applying the first offset so DST boundaries use
        // the offset that is valid at the candidate instant.
        for (let attempt = 0; attempt < 3; attempt += 1) {
            timestamp = naiveUtc - getOffsetMinutes(new Date(timestamp), timeZone) * 60000;
        }

        const result = new Date(timestamp);
        if (formatDate(result, timeZone) !== formatDateParts(parts)) {
            throw new RangeError('Date time does not exist in the selected timezone');
        }
        return Math.floor(timestamp / 1000);
    }

    function formatDateParts(parts) {
        const year = String(parts.year).padStart(4, '0');
        const month = String(parts.month).padStart(2, '0');
        const day = String(parts.day).padStart(2, '0');
        const hour = String(parts.hour).padStart(2, '0');
        const minute = String(parts.minute).padStart(2, '0');
        const second = String(parts.second).padStart(2, '0');
        return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
    }

    function formatDate(date, timeZone) {
        if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
            throw new RangeError('Invalid date');
        }
        const parts = new Intl.DateTimeFormat('en-CA', {
            timeZone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        }).formatToParts(date).reduce((result, part) => {
            if (part.type !== 'literal') result[part.type] = Number(part.value);
            return result;
        }, {});
        return formatDateParts(parts);
    }

    return {
        dateTimeToTimestamp,
        formatDate,
        getOffsetMinutes,
        getTimezones,
        parseDateTime,
        parseTimestamp
    };
});
