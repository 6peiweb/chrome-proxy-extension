import { createApp } from 'vue';

import { create, NButton } from 'naive-ui';

import App from './components/App.vue';

const app = createApp(App);
const naive = create({
    components: [NButton],
});

app.use(naive)
app.mount('#app');

/**
 * Temporary workaround for secondary monitors on MacOS where redraws don't happen
 * @See https://bugs.chromium.org/p/chromium/issues/detail?id=971701
 */
if (
    window.screenLeft < 0 ||
    window.screenTop < 0 ||
    window.screenLeft > window.screen.width ||
    window.screenTop > window.screen.height
) {
    chrome.runtime.getPlatformInfo(info => {
        if (info.os !== 'mac') {
            return;
        }
        const fontFaceSheet = new CSSStyleSheet();
        fontFaceSheet.insertRule(`
              @keyframes redraw {
                0% {
                  opacity: 1;
                }
                100% {
                  opacity: .99;
                }
              }
            `);
        fontFaceSheet.insertRule(`
              html {
                animation: redraw 1s linear infinite;
              }
            `);
        document.adoptedStyleSheets = [...document.adoptedStyleSheets, fontFaceSheet];
    });
}