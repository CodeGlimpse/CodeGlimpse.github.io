(function (root, factory) {
    const api = factory(root);

    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    }

    if (root) {
        root.CodeGlimpsePassword = api;
    }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
    const CHARACTER_SETS = Object.freeze({
        lower: 'abcdefghijklmnopqrstuvwxyz',
        upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        numbers: '0123456789',
        symbols: '!@#$%^&*()-_=+[]{};:,.?'
    });
    const AMBIGUOUS = 'Il1O0o';

    function normalizeOptions(options = {}) {
        const length = Number(options.length ?? 20);
        if (!Number.isInteger(length) || length < 8 || length > 128) {
            throw new RangeError('Password length must be an integer between 8 and 128');
        }

        const enabled = {
            lower: options.lower !== false,
            upper: options.upper !== false,
            numbers: options.numbers !== false,
            symbols: options.symbols !== false
        };
        const sets = Object.entries(CHARACTER_SETS)
            .filter(([name]) => enabled[name])
            .map(([name, characters]) => ({
                name,
                characters: options.excludeAmbiguous
                    ? Array.from(characters).filter((character) => !AMBIGUOUS.includes(character)).join('')
                    : characters
            }))
            .filter((set) => set.characters.length > 0);

        if (sets.length === 0) throw new RangeError('Select at least one character set');
        if (length < sets.length) throw new RangeError('Password length is shorter than the selected character set count');

        return {
            excludeAmbiguous: Boolean(options.excludeAmbiguous),
            length,
            pool: sets.map((set) => set.characters).join(''),
            sets
        };
    }

    function createByteReader(source) {
        let bytes = new Uint8Array(0);
        let offset = 0;

        function refill() {
            if (typeof source === 'function') {
                const supplied = source(64);
                if (!supplied || supplied.length !== 64) {
                    throw new TypeError('Random source must return the requested byte count');
                }
                bytes = Uint8Array.from(supplied);
            } else {
                const cryptoApi = source?.getRandomValues ? source : root?.crypto;
                if (!cryptoApi?.getRandomValues) throw new Error('Secure random generation is unavailable');
                bytes = new Uint8Array(64);
                cryptoApi.getRandomValues(bytes);
            }
            offset = 0;
        }

        return function randomIndex(maximum) {
            if (!Number.isInteger(maximum) || maximum < 1 || maximum > 256) {
                throw new RangeError('Random selection range must be between 1 and 256');
            }
            const limit = 256 - (256 % maximum);
            for (let attempt = 0; attempt < 10000; attempt += 1) {
                if (offset >= bytes.length) refill();
                const value = bytes[offset];
                offset += 1;
                if (value < limit) return value % maximum;
            }
            throw new Error('Random source did not produce an unbiased value');
        };
    }

    function buildPassword(normalized, randomIndex) {
        const characters = normalized.sets.map((set) => (
            set.characters[randomIndex(set.characters.length)]
        ));
        while (characters.length < normalized.length) {
            characters.push(normalized.pool[randomIndex(normalized.pool.length)]);
        }
        for (let index = characters.length - 1; index > 0; index -= 1) {
            const swapIndex = randomIndex(index + 1);
            [characters[index], characters[swapIndex]] = [characters[swapIndex], characters[index]];
        }
        return characters.join('');
    }

    function generate(options, source) {
        const normalized = normalizeOptions(options);
        return buildPassword(normalized, createByteReader(source));
    }

    function generateMany(options, countValue = 1, source) {
        const count = Number(countValue);
        if (!Number.isInteger(count) || count < 1 || count > 20) {
            throw new RangeError('Password count must be an integer between 1 and 20');
        }
        const normalized = normalizeOptions(options);
        const randomIndex = createByteReader(source);
        return Array.from({ length: count }, () => buildPassword(normalized, randomIndex));
    }

    function estimateEntropy(options) {
        const normalized = normalizeOptions(options);
        return normalized.length * Math.log2(normalized.pool.length);
    }

    return { AMBIGUOUS, CHARACTER_SETS, estimateEntropy, generate, generateMany, normalizeOptions };
});
