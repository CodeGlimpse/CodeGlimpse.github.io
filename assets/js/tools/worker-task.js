function run(url, payload, transfers = []) {
    let cancel = () => {};
    const promise = new Promise((resolve, reject) => {
        if (typeof Worker !== 'function') { reject(new Error('unsupported')); return; }
        const address = new URL(url, location.href);
        if (address.origin !== location.origin || !address.pathname.startsWith('/js/tools/')) { reject(new Error('invalid')); return; }
        const worker = new Worker(address.href);
        let done = false;
        const finish = (error, result) => {
            if (done) return;
            done = true;
            clearTimeout(timer);
            worker.onmessage = null; worker.onerror = null; worker.terminate();
            if (error) reject(error); else resolve(result);
        };
        const timer = setTimeout(() => finish(new Error('timeout')), 6000);
        cancel = () => finish(new Error('cancelled'));
        worker.onmessage = event => finish(event.data.error ? new Error(event.data.error) : null, event.data.result);
        worker.onerror = () => finish(new Error('unavailable'));
        try { worker.postMessage(payload, transfers); } catch (error) { finish(error); }
    });
    return { promise, cancel: () => cancel() };
}
module.exports = { run };
