// ** utils/enum

const CURRENT_PROXY_CONFIG = 'CURRENT_PROXY_CONFIG';

// ** utils/log

function log(type, msg) {
    const labelStyle = 'background: #606060; color: #fff; border-radius: 3px 0 0 3px; padding: 2px 4px; ';
    const contentStyle = 'background: #1475B2; color: #fff; border-radius: 0 3px 3px 0; padding: 2px 4px; ';
    console.info(`%c${type}:%c${msg}`, labelStyle, contentStyle);
}

function error(type, msg) {
    const labelStyle = 'background: #f14101; color: #fff; border-radius: 3px 0 0 3px; padding: 2px 4px; ';
    const contentStyle = 'background: #a3a2a1; color: #fff; border-radius: 0 3px 3px 0; padding: 2px 4px; ';
    console.info(`%c${type}:%c${msg}`, labelStyle, contentStyle);
}

// ** Main

chrome.runtime.onInstalled.addListener(runtimeInfo => {
    log('RUNTIME', JSON.stringify(runtimeInfo));

    chrome.tabs.onActiveChanged.addListener(async () => {
        await sendMessage();
    });
    chrome.tabs.onUpdated.addListener(async () => {
        await sendMessage();
    });

    chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
        switch (request.type) {
            case 'GET_STORAGE':
                return await getStorage(request.key);
            default:
                sendResponse();
                return;
        }
    });

    chrome.webRequest.onBeforeSendHeaders.addListener(
        (details) => {
            const requestHeaders = [
                ...details.requestHeaders,
                { name: 'fe-env-ppe', value: 'liupei' },
            ];
            return { requestHeaders };
        },
        { urls: ["<all_urls>"] },
        ["blocking", "requestHeaders"],
    );

    chrome.webRequest.onHeadersReceived.addListener(
        (details) => {
            details.responseHeaders.push({ name: 'Access-Control-Allow-Origin', value: "*" });
            return { responseHeaders: details.responseHeaders };
        },
        { urls: ["<all_urls>"] },
        ["blocking", "responseHeaders"],
    );

    chrome.webRequest.onCompleted.addListener(
        (details) => {
            // console.log('details', details);
        },
        { urls: ["<all_urls>"] },
        [],
    );
});

// ** Status

function setStatus(status) {
    chrome.browserAction.setIcon({
        path: status ? 'icon.png' : 'wait.png',
    });
    log('Status', status);
}


// ** Messages
async function sendMessage() {
    const tabInfo = await getActivedTabs();
    const result = await getStorage(CURRENT_PROXY_CONFIG);
    chrome.tabs.sendMessage(tabInfo.id, {
        type: CURRENT_PROXY_CONFIG,
        value: result,
    });

    if (result &&
        (!result.url
            || (result.url && tabInfo.url.includes(result.url)))
    ) {
        setStatus(true);
    } else {
        setStatus(false);
    }

}


// ** Tabs

function getTabInfo(tabId) {
    return new Promise((resolve) => {
        chrome.tabs.get(tabId, resolve);
    });
}

function getActivedTabs() {
    return new Promise((resolve) => {
        chrome.tabs.query({
            active: true,
            lastFocusedWindow: true,
        }, tabs => {
            try {
                resolve(tabs[0]);
            } catch {
                setTimeout(() => {
                    resolve(getActivedTabs());
                }, 100);
            }
        });
    });
}


// ** Storage

function getStorage(key) {
    return new Promise(resolve => {
        chrome.storage.sync.get(key, result => {
            log('STORAGE', `get ${key}:${result[key]} successful!!!`);
            resolve(result[key]);
        });
    });
}

function getStorages(keys) {
    return new Promise(resolve => {
        chrome.storage.sync.get(keys, result => {
            log('STORAGE', `get successful!!!`);
            resolve(result);
        });
    });
}

function setStorage(key, value) {
    return new Promise(resolve => {
        getStorage(key).then(res => {
            const newValue = value instanceof Object && res instanceof Object ?
                { ...res, ...value } : value;
            chrome.storage.sync.set({ [key]: newValue }, () => {
                log('STORAGE', `set ${key}:${value} successful!!!`);
                resolve();
            });
        });
    });
}

function setStorages(data) {
    return new Promise(resolve => {
        chrome.storage.sync.set(data, () => {
            log('STORAGE', `set successful!!!`);
            resolve();
        });
    });
}

function clearStorage() {
    return new Promise(resolve => {
        chrome.storage.sync.clear(() => {
            log('STORAGE', 'clear successful!!!');
            resolve();
        });
    });
}
