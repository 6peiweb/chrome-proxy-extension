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
            // document.documentElement.removeChild(script);
            resolve();
        }

        document.documentElement.appendChild(script);
    })
}

chrome.runtime.onMessage.addListener(request => {
    window.postMessage(request);
    const labelStyle = 'background: #606060; color: #fff; border-radius: 3px 0 0 3px; padding: 2px 4px; ';
    const contentStyle = 'background: #1475B2; color: #fff; border-radius: 0 3px 3px 0; padding: 2px 4px; ';
    const type = 'Proxy';
    const msg = ` status(${request.value.status}) ConfigName(${request.value.name}) `;
    console.info(`%c${type}:%c${msg}`, labelStyle, contentStyle);
    console.table([...request.value.rules, ...request.value.rules]);
});

