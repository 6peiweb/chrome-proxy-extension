import {
    createXHR,
    createFetch,
    OriginalXHR,
    OriginalFetch,
} from './xhr-interceptor';
import { CURRENT_PROXY_CONFIG } from '../utils/enum';

window.addEventListener('message', event => {
    const { type, value } = event.data;

    if (type === CURRENT_PROXY_CONFIG && value) {
        if (value.intercept) {
            window.fetch = createFetch(value);
            window.XMLHttpRequest = createXHR(value);
            console.warn('Proxy Extension:', value);
        } else {
            window.fetch = OriginalFetch;
            window.XMLHttpRequest = OriginalXHR;
            console.warn('Proxy Extension: close successful!!!');
        }
    }
}, false);

const AjaxInterceptor = {
    intercept: false,
    rules: [
        {
            match: 'www.tiktok.com',
            filterType: 'normal',
            checked: true,
            httpStatus: 404,
            responseText: '{"a":1}',
        },
        {
            match: '/api/v1/affiliate/account/info',
            filterType: 'normal',
            checked: true,
            httpStatus: 404,
            responseText: '{"code":0,"a":1}',
        },
    ],
};

// window.fetch = createFetch(AjaxInterceptor);
// window.XMLHttpRequest = createXHR(AjaxInterceptor);