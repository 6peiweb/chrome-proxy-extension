import { log, error } from '../utils/log';

const OriginalXHR = window.XMLHttpRequest;
const OriginalFetch = window.fetch.bind(window);

const createXHR = (AjaxInterceptor) => {
    return class {
        constructor() {
            this.xhr = new OriginalXHR();
            this.initConfig();
        }

        initConfig() {
            const { xhr } = this;
            if (!xhr) {
                return;
            }
            for (let attr in xhr) {
                if (attr === 'onreadystatechange') {
                    Object.defineProperty(this, attr, {
                        set: (newFn) => (this[`_${attr}`] = newFn),
                        enumerable: true,
                    });
                    xhr.onreadystatechange = (...args) => {
                        if (this.readyState === 4 && AjaxInterceptor.status) {
                            this.modifyResponse();
                        }
                        if (this[`_${attr}`]) {
                            this[`_${attr}`].apply(this, args);
                        }
                    };
                } else if (attr.startsWith('on')) {
                    Object.defineProperty(this, attr, {
                        set: (newFn) => (this[`_${attr}`] = newFn),
                        enumerable: true,
                    });
                    xhr[attr] = (...args) => {
                        if (AjaxInterceptor.status) {
                            this.modifyResponse();
                        }
                        if (this[`_${attr}`]) {
                            this[`_${attr}`].apply(this, args);
                        }
                    };
                } else if (attr === 'open') {
                    this[attr] = (...args) => {
                        const url = args[1];
                        this.REQUEST_URL = /^http/.test(url) ? url : location.origin + url;
                        xhr[attr].apply(xhr, args);
                    };
                } else if (typeof xhr[attr] === 'function') {
                    this[attr] = xhr[attr].bind(xhr);
                } else {
                    if (['responseText', 'response', 'status'].includes(attr)) {
                        Object.defineProperty(this, attr, {
                            get: () => (this[`_${attr}`] === undefined ? xhr[attr] : this[`_${attr}`]),
                            set: (val) => (this[`_${attr}`] = val),
                            enumerable: true,
                        });
                    } else {
                        Object.defineProperty(this, attr, {
                            set: (val) => (xhr[attr] = val),
                            get: () => xhr[attr],
                            enumerable: true,
                        });
                    }
                }
            }
        }

        modifyResponse() {
            if (AjaxInterceptor.rules && AjaxInterceptor.rules.length) {
                AjaxInterceptor.rules.forEach((rule) => {
                    const { match, filterType, httpStatus = 200, checked = true, responseText = '' } = rule;
                    let matched = false;
                    if (
                        checked &&
                        match &&
                        ((filterType === 'normal' && this.REQUEST_URL.includes(match)) ||
                            (filterType === 'regexp' && this.REQUEST_URL.match(new RegExp(match, 'i'))))
                    ) {
                        matched = true;
                    }

                    if (matched) {
                        this.responseText = responseText;
                        this.status = httpStatus;
                        try {
                            this.response = JSON.parse(responseText);
                        } catch {
                            this.response = responseText;
                        }
                    }
                });
            }
        }
    };
};

const createFetch = (AjaxInterceptor) => {
    return (...args) => {
        function getRequestUrl() {
            const request = args[0];

            function resolveUrl(url) {
                if (/^http/.test(url)) {
                    return url;
                }
                return location.origin + url;
            }

            if (request instanceof Object) {
                return resolveUrl(request.url);
            } else if (typeof request === 'string') {
                return resolveUrl(request);
            }

            log('REQUEST', `\`${typeof request}\``);
            return '';
        }

        function matchRule() {
            const url = getRequestUrl();
            let result = undefined;
            if (AjaxInterceptor.status && AjaxInterceptor.rules && AjaxInterceptor.rules.length) {
                AjaxInterceptor.rules.forEach((rule) => {
                    const { match, filterType, checked = true, httpStatus = 200, responseText = '' } = rule;
                    let matched = false;
                    if (
                        checked &&
                        match &&
                        ((filterType === 'normal' && url.includes(match)) || (filterType === 'regexp' && url.match(new RegExp(match, 'i'))))
                    ) {
                        matched = true;
                    }

                    if (matched) {
                        result = { httpStatus, responseText };
                    }
                });
            }

            return result;
        }

        function createStream(text) {
            return new ReadableStream({
                start(controller) {
                    controller.enqueue(new TextEncoder().encode(text));
                    controller.close();
                },
            });
        }

        return OriginalFetch(...args)
            .then((response) => {
                const result = matchRule();

                if (result !== undefined) {
                    const stream = createStream(result.responseText);
                    const newResponse = new Response(stream, {
                        status: Number(result.httpStatus),
                        statusText: response.statusText,
                        headers: response.headers,
                    });
                    const proxy = new Proxy(newResponse, {
                        get: (target, name) => {
                            switch (name) {
                                case 'ok':
                                case 'url':
                                case 'type':
                                case 'body':
                                case 'bodyUsed':
                                case 'redirected':
                                case 'useFinalURL':
                                    return response[name];
                            }
                            return target[name];
                        },
                    });

                    for (let attr in proxy) {
                        if (typeof proxy[attr] === 'function') {
                            proxy[attr] = proxy[attr].bind(newResponse);
                        }
                    }

                    return proxy;
                }

                return response;
            })
            .catch((err) => {
                error('PROXY', err.message);
                const result = matchRule();

                if (result !== undefined) {
                    const stream = createStream(result.responseText);
                    return new Response(stream, {
                        statusText: String(result.httpStatus),
                        status: Number(result.httpStatus),
                        headers: new Headers({
                            'Content-Type': 'application/json; charset=utf-8',
                        }),
                    });
                }

                return Promise.reject(err);
            });
    };
};

export { OriginalFetch, OriginalXHR, createFetch, createXHR };
