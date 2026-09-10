const core = require('./qrcode-core.js');
self.onmessage = event => {
    try {
        const input = event.data;
        if (input.kind === 'encode') {
            const result = core.encode(input.text, input.level);
            self.postMessage({ result }, [result.cells.buffer]);
        } else if (input.kind === 'decode') {
            self.postMessage({ result: core.decode(input.pixels, input.width, input.height) });
        } else throw new Error('invalid');
    } catch (error) { self.postMessage({ error: error.message || 'invalid' }); }
};
