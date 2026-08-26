(function () {
    function getLanguage() {
        return document.documentElement.lang === 'zh-cn' ? 'zh-cn' : 'en';
    }

    function notify(type, chinese, english) {
        const message = getLanguage() === 'zh-cn' ? chinese : english;
        window.CodeGlimpseToast?.show({ type, message });
    }

    function registerServiceWorker() {
        if (!('serviceWorker' in navigator) || !/^https?:$/.test(location.protocol)) return;
        navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
            // Offline enhancement is optional; the tools remain fully usable without it.
        });
    }

    function start() {
        let wasOffline = navigator.onLine === false;
        if (wasOffline) {
            notify('warning', '当前离线：已缓存页面仍可访问，工具继续在本地运行。', 'Offline: cached pages remain available and tools continue running locally.');
        }
        window.addEventListener('offline', () => {
            wasOffline = true;
            notify('warning', '当前离线：已缓存页面仍可访问，工具继续在本地运行。', 'Offline: cached pages remain available and tools continue running locally.');
        });
        window.addEventListener('online', () => {
            if (!wasOffline) return;
            wasOffline = false;
            notify('success', '网络已恢复，工具仍在浏览器本地处理数据。', 'Back online. Tool data is still processed locally in your browser.');
        });
        registerServiceWorker();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start, { once: true });
    } else {
        start();
    }
})();
