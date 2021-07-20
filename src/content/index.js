// ** utils/enum

const CURRENT_PROXY_CONFIG = 'CURRENT_PROXY_CONFIG';

loadScript('js/inject.js').then(() => {
    chrome.storage.sync.get(CURRENT_PROXY_CONFIG, result => {
        window.postMessage({
            type: CURRENT_PROXY_CONFIG,
            value: result[CURRENT_PROXY_CONFIG],
        });
    })
});

function loadScript(url) {
    return new Promise(resolve => {
        const script = document.createElement('script');
        const scriptSrc = chrome.extension.getURL(url);

        script.setAttribute('type', 'text/javascript');
        script.setAttribute('src', scriptSrc);

        script.onload = () => {
            document.documentElement.removeChild(script);
            resolve();
        }

        document.documentElement.appendChild(script);
    })
}

chrome.runtime.onMessage.addListener(request => {
    window.postMessage(request);
});

