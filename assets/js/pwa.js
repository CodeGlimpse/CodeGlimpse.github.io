(function (root) {
    let deferredPrompt = null;
    let installButton = null;

    function language() {
        return root.document?.documentElement?.lang === 'zh-cn' ? 'zh-cn' : 'en';
    }

    function updateButton() {
        if (!installButton) return;
        installButton.textContent = language() === 'zh-cn' ? '安装 CodeGlimpse' : 'Install CodeGlimpse';
        installButton.hidden = !deferredPrompt;
    }

    function createButton() {
        if (!root.document?.body || installButton) return;
        installButton = root.document.createElement('button');
        installButton.type = 'button';
        installButton.id = 'codeglimpse-install';
        installButton.className = 'codeglimpse-install';
        installButton.hidden = true;
        installButton.addEventListener('click', async () => {
            if (!deferredPrompt) return;
            deferredPrompt.prompt();
            await deferredPrompt.userChoice;
            deferredPrompt = null;
            updateButton();
        });
        root.document.body.appendChild(installButton);
        updateButton();
    }

    root.addEventListener?.('beforeinstallprompt', (event) => {
        event.preventDefault();
        deferredPrompt = event;
        createButton();
        updateButton();
    });
    root.addEventListener?.('appinstalled', () => {
        deferredPrompt = null;
        updateButton();
        root.CodeGlimpseToast?.show({
            type: 'success',
            message: language() === 'zh-cn' ? 'CodeGlimpse 已安装' : 'CodeGlimpse was installed'
        });
    });

    if (root.document?.readyState === 'loading') {
        root.document.addEventListener('DOMContentLoaded', createButton, { once: true });
    } else {
        createButton();
    }
})(typeof globalThis !== 'undefined' ? globalThis : this);
