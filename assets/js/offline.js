(function () {
    function getLanguage() {
        return document.documentElement.lang === 'zh-cn' ? 'zh-cn' : 'en';
    }

    function createStatus() {
        const existing = document.getElementById('offline-status');
        if (existing) return existing;
        const status = document.createElement('div');
        status.id = 'offline-status';
        status.className = 'offline-status';
        status.setAttribute('role', 'status');
        status.setAttribute('aria-live', 'polite');
        document.body.appendChild(status);
        return status;
    }

    function updateStatus(status) {
        const online = navigator.onLine !== false;
        const text = getLanguage() === 'zh-cn'
            ? (online ? '已在线，工具数据仅在浏览器本地处理。' : '当前离线：已缓存页面仍可访问，工具继续在本地运行。')
            : (online ? 'Online. Tool data is processed locally in your browser.' : 'Offline: cached pages remain available and tools continue running locally.');
        status.textContent = text;
        status.dataset.online = online ? 'true' : 'false';
    }

    function registerServiceWorker() {
        if (!('serviceWorker' in navigator) || !/^https?:$/.test(location.protocol)) return;
        navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
            // Offline enhancement is optional; the tools remain fully usable without it.
        });
    }

    function start() {
        const status = createStatus();
        updateStatus(status);
        window.addEventListener('online', () => updateStatus(status));
        window.addEventListener('offline', () => updateStatus(status));
        registerServiceWorker();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start, { once: true });
    } else {
        start();
    }
})();
