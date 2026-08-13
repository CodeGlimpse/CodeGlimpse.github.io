(function (root, factory) {
    const api = factory();

    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    }

    if (root) root.CodeGlimpseColor = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    function clamp(value, min, max) {
        return Math.min(max, Math.max(min, Number(value)));
    }

    function hexToRgb(value) {
        const text = String(value).trim().replace(/^#/, '');
        if (!/^(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(text)) {
            throw new SyntaxError('Invalid hexadecimal color');
        }
        const hex = text.length === 3 ? text.split('').map(char => char + char).join('') : text;
        const number = Number.parseInt(hex, 16);
        return {
            r: (number >> 16) & 255,
            g: (number >> 8) & 255,
            b: number & 255
        };
    }

    function rgbToHex(red, green, blue) {
        const r = clamp(red, 0, 255);
        const g = clamp(green, 0, 255);
        const b = clamp(blue, 0, 255);
        if (![r, g, b].every(Number.isInteger)) throw new RangeError('RGB values must be integers');
        return `#${[r, g, b].map(value => value.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
    }

    function rgbToHsl(red, green, blue) {
        const r = clamp(red, 0, 255) / 255;
        const g = clamp(green, 0, 255) / 255;
        const b = clamp(blue, 0, 255) / 255;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const lightness = (max + min) / 2;
        if (max === min) return { h: 0, s: 0, l: Math.round(lightness * 100) };

        const delta = max - min;
        const saturation = lightness > 0.5
            ? delta / (2 - max - min)
            : delta / (max + min);
        let hue;
        if (max === r) hue = (g - b) / delta + (g < b ? 6 : 0);
        else if (max === g) hue = (b - r) / delta + 2;
        else hue = (r - g) / delta + 4;

        return {
            h: Math.round((hue / 6) * 360),
            s: Math.round(saturation * 100),
            l: Math.round(lightness * 100)
        };
    }

    function hslToRgb(hue, saturation, lightness) {
        const h = clamp(hue, 0, 360) / 360;
        const s = clamp(saturation, 0, 100) / 100;
        const l = clamp(lightness, 0, 100) / 100;
        if (s === 0) {
            const value = Math.round(l * 255);
            return { r: value, g: value, b: value };
        }

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        const hueToRgb = (t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };

        return {
            r: Math.round(hueToRgb(h + 1 / 3) * 255),
            g: Math.round(hueToRgb(h) * 255),
            b: Math.round(hueToRgb(h - 1 / 3) * 255)
        };
    }

    return { hexToRgb, hslToRgb, rgbToHex, rgbToHsl };
});
