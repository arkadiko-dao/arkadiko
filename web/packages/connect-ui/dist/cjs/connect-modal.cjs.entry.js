'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const index = require('./index-f13d5b63.js');

const appendToMap = (map, propName, value) => {
    const items = map.get(propName);
    if (!items) {
        map.set(propName, [value]);
    }
    else if (!items.includes(value)) {
        items.push(value);
    }
};
const debounce = (fn, ms) => {
    let timeoutId;
    return (...args) => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
            timeoutId = 0;
            fn(...args);
        }, ms);
    };
};

/**
 * Check if a possible element isConnected.
 * The property might not be there, so we check for it.
 *
 * We want it to return true if isConnected is not a property,
 * otherwise we would remove these elements and would not update.
 *
 * Better leak in Edge than to be useless.
 */
const isConnected = (maybeElement) => !('isConnected' in maybeElement) || maybeElement.isConnected;
const cleanupElements = debounce((map) => {
    for (let key of map.keys()) {
        map.set(key, map.get(key).filter(isConnected));
    }
}, 2000);
const stencilSubscription = ({ on }) => {
    const elmsToUpdate = new Map();
    if (typeof index.getRenderingRef === 'function') {
        // If we are not in a stencil project, we do nothing.
        // This function is not really exported by @stencil/core.
        on('dispose', () => {
            elmsToUpdate.clear();
        });
        on('get', (propName) => {
            const elm = index.getRenderingRef();
            if (elm) {
                appendToMap(elmsToUpdate, propName, elm);
            }
        });
        on('set', (propName) => {
            const elements = elmsToUpdate.get(propName);
            if (elements) {
                elmsToUpdate.set(propName, elements.filter(index.forceUpdate));
            }
            cleanupElements(elmsToUpdate);
        });
        on('reset', () => {
            elmsToUpdate.forEach((elms) => elms.forEach(index.forceUpdate));
            cleanupElements(elmsToUpdate);
        });
    }
};

const createObservableMap = (defaultState, shouldUpdate = (a, b) => a !== b) => {
    let states = new Map(Object.entries(defaultState !== null && defaultState !== void 0 ? defaultState : {}));
    const handlers = {
        dispose: [],
        get: [],
        set: [],
        reset: [],
    };
    const reset = () => {
        states = new Map(Object.entries(defaultState !== null && defaultState !== void 0 ? defaultState : {}));
        handlers.reset.forEach((cb) => cb());
    };
    const dispose = () => {
        // Call first dispose as resetting the state would
        // cause less updates ;)
        handlers.dispose.forEach((cb) => cb());
        reset();
    };
    const get = (propName) => {
        handlers.get.forEach((cb) => cb(propName));
        return states.get(propName);
    };
    const set = (propName, value) => {
        const oldValue = states.get(propName);
        if (shouldUpdate(value, oldValue, propName)) {
            states.set(propName, value);
            handlers.set.forEach((cb) => cb(propName, value, oldValue));
        }
    };
    const state = (typeof Proxy === 'undefined'
        ? {}
        : new Proxy(defaultState, {
            get(_, propName) {
                return get(propName);
            },
            ownKeys(_) {
                return Array.from(states.keys());
            },
            getOwnPropertyDescriptor() {
                return {
                    enumerable: true,
                    configurable: true,
                };
            },
            has(_, propName) {
                return states.has(propName);
            },
            set(_, propName, value) {
                set(propName, value);
                return true;
            },
        }));
    const on = (eventName, callback) => {
        handlers[eventName].push(callback);
        return () => {
            removeFromArray(handlers[eventName], callback);
        };
    };
    const onChange = (propName, cb) => {
        const unSet = on('set', (key, newValue) => {
            if (key === propName) {
                cb(newValue);
            }
        });
        const unReset = on('reset', () => cb(defaultState[propName]));
        return () => {
            unSet();
            unReset();
        };
    };
    const use = (...subscriptions) => subscriptions.forEach((subscription) => {
        if (subscription.set) {
            on('set', subscription.set);
        }
        if (subscription.get) {
            on('get', subscription.get);
        }
        if (subscription.reset) {
            on('reset', subscription.reset);
        }
    });
    return {
        state,
        get,
        set,
        on,
        onChange,
        use,
        dispose,
        reset,
    };
};
const removeFromArray = (array, item) => {
    const index = array.indexOf(item);
    if (index >= 0) {
        array[index] = array[array.length - 1];
        array.length--;
    }
};

const createStore = (defaultState, shouldUpdate) => {
    const map = createObservableMap(defaultState, shouldUpdate);
    stencilSubscription(map);
    return map;
};

var Screens;
(function (Screens) {
    Screens["INTRO"] = "INTRO";
    Screens["HOW_IT_WORKS"] = "HOW_IT_WORKS";
    Screens["FINISHED"] = "FINISHED";
})(Screens || (Screens = {}));
const { state } = createStore({
    screen: Screens.INTRO,
});

const CloseIcon = ({ onClick }) => (index.h("svg", { width: 16, height: 16, viewBox: "0 0 16 16", onClick: onClick },
    index.h("path", { fill: "#C1C3CC", d: "M4.817 3.403a1 1 0 00-1.414 1.414L6.586 8l-3.183 3.183a1 1 0 001.414 1.415L8 9.415l3.183 3.183a1 1 0 101.415-1.415L9.415 8l3.183-3.183a1.002 1.002 0 00-.325-1.631 1 1 0 00-1.09.217L8 6.586 4.817 3.403z" })));

const ChevronIcon = () => {
    return (index.h("svg", { width: "16px", height: "16px", viewBox: "0 0 16 16", style: { transform: `rotate(90deg)` }, onClick: () => (state.screen = Screens.INTRO) },
        index.h("path", { fill: 'currentColor', d: "M4.7 7.367l3.3 3.3 3.3-3.3-.943-.943L8 8.78 5.643 6.424l-.943.943z" })));
};

const PadlockIcon = () => (index.h("svg", { width: "24", height: "24", viewBox: "0 0 24 24", fill: "none" },
    index.h("path", { d: "M18.5818 8.57143H17.7091V6C17.7091 4.4087 17.0655 2.88258 15.9198 1.75736C14.7741 0.632141 13.2202 0 11.6 0C9.97977 0 8.4259 0.632141 7.28022 1.75736C6.13454 2.88258 5.49091 4.4087 5.49091 6V8.57143H4.61818C3.92403 8.57218 3.25853 8.84334 2.76769 9.32541C2.27685 9.80748 2.00076 10.4611 2 11.1429V21.4286C2.00076 22.1103 2.27685 22.7639 2.76769 23.246C3.25853 23.7281 3.92403 23.9993 4.61818 24H18.5818C19.276 23.9993 19.9415 23.7281 20.4323 23.246C20.9231 22.7639 21.1992 22.1103 21.2 21.4286V11.1429C21.1992 10.4611 20.9231 9.80748 20.4323 9.32541C19.9415 8.84334 19.276 8.57218 18.5818 8.57143ZM7.23636 6C7.23636 4.86336 7.6961 3.77327 8.51444 2.96954C9.33278 2.16582 10.4427 1.71429 11.6 1.71429C12.7573 1.71429 13.8672 2.16582 14.6856 2.96954C15.5039 3.77327 15.9636 4.86336 15.9636 6V8.57143H7.23636V6Z", fill: "#3700ff" })));

const EyeIcon = () => (index.h("svg", { width: "24", height: "20", viewBox: "0 0 24 20" },
    index.h("path", { d: "M19.695 0.351482C19.9032 0.135371 20.1868 0.00948757 20.4855 0.000511017C20.7171 -0.00642408 20.9454 0.057366 21.1405 0.183512C21.3356 0.309658 21.4883 0.492283 21.5786 0.707441C21.669 0.922599 21.6927 1.16026 21.6468 1.38926C21.6008 1.61827 21.4873 1.82793 21.3212 1.99078L4.3048 19.1469C4.19867 19.2575 4.07178 19.3456 3.93152 19.4062C3.79125 19.4668 3.64043 19.4987 3.48783 19.5C3.33523 19.5012 3.1839 19.4718 3.04268 19.4135C2.90146 19.3552 2.77316 19.2691 2.66526 19.1603C2.55735 19.0515 2.47201 18.9222 2.4142 18.7798C2.35639 18.6374 2.32727 18.4849 2.32854 18.331C2.3298 18.1771 2.36143 18.0251 2.42157 17.8837C2.48171 17.7423 2.56917 17.6143 2.67885 17.5074L19.695 0.351482ZM0.193655 8.95376C2.47935 4.5123 7.03523 1.71636 11.9982 1.71636C13.5143 1.71601 14.9919 1.97725 16.3789 2.46512L14.7583 4.09901C13.9263 3.68538 12.9904 3.45188 12 3.45188C8.55044 3.45188 5.754 6.27118 5.75403 9.74917C5.75404 10.7476 5.98562 11.6913 6.39588 12.5301L3.92169 15.0246C2.39514 13.8491 1.11258 12.3359 0.194802 10.5571C-0.0645738 10.0547 -0.0649106 9.45653 0.193655 8.95376ZM17.6041 6.96802L20.0781 4.47375C21.6047 5.64932 22.8874 7.16248 23.8052 8.94153C24.0646 9.44387 24.0649 10.042 23.8064 10.5448C21.5205 14.9863 16.9647 17.7818 12.0018 17.7818C10.4857 17.7821 9.00815 17.5209 7.62116 17.033L9.2415 15.3994C10.0735 15.813 11.0096 16.0465 12 16.0465C15.4496 16.0465 18.246 13.227 18.246 9.74917C18.246 8.75058 18.0145 7.80688 17.6041 6.96802ZM9.24284 6.96914C10.0042 6.20163 11.0022 5.81824 12 5.81824C12.3155 5.81824 12.6308 5.85684 12.9387 5.93349L8.2154 10.6956C7.89855 9.40286 8.24082 7.97945 9.24284 6.96914ZM11.0613 13.5647L15.7846 8.80249C16.1013 10.0952 15.7589 11.5184 14.7569 12.5285C13.755 13.5388 12.3434 13.8839 11.0613 13.5647Z", fill: '#3700ff'  }),
    index.h("path", { d: "M19.6951 0.351482C19.9034 0.135371 20.1869 0.00948757 20.4856 0.000511017C20.7173 -0.00642408 20.9456 0.057366 21.1406 0.183512C21.3357 0.309658 21.4884 0.492283 21.5787 0.707441C21.6691 0.922599 21.6928 1.16026 21.6469 1.38926C21.6009 1.61827 21.4874 1.82793 21.3213 1.99078L4.30491 19.1469C4.19879 19.2575 4.07189 19.3456 3.93163 19.4062C3.79137 19.4668 3.64054 19.4987 3.48794 19.5C3.33534 19.5012 3.18402 19.4718 3.0428 19.4135C2.90157 19.3552 2.77327 19.2691 2.66537 19.1603C2.55747 19.0515 2.47213 18.9222 2.41432 18.7798C2.35651 18.6374 2.32739 18.4849 2.32865 18.331C2.32992 18.1771 2.36154 18.0251 2.42169 17.8837C2.48183 17.7423 2.56929 17.6143 2.67896 17.5074L19.6951 0.351482Z", fill: '#3700ff'  })));

const LinkIcon = () => {
    return (index.h("svg", { xmlns: "http://www.w3.org/2000/svg", width: "32", height: "7", fill: "none", viewBox: "0 0 32 7" },
        index.h("mask", { id: "a", width: "32", height: "7", x: "0", y: "0", fill: "#000", maskUnits: "userSpaceOnUse" },
            index.h("path", { fill: "#fff", d: "M0 0H32V7H0z" }),
            index.h("path", { "fill-rule": "evenodd", d: "M3.5 5a1.5 1.5 0 001.415-1h22.17a1.5 1.5 0 100-1H4.915A1.5 1.5 0 103.5 5z", "clip-rule": "evenodd" })),
        index.h("path", { fill: "#677282", "fill-rule": "evenodd", d: "M3.5 5a1.5 1.5 0 001.415-1h22.17a1.5 1.5 0 100-1H4.915A1.5 1.5 0 103.5 5z", "clip-rule": "evenodd" }),
        index.h("path", { fill: "#fff", d: "M4.915 4V2H3.5L3.03 3.334 4.915 4zm22.17 0l1.886-.667L28.5 2h-1.415v2zm0-1v2H28.5l.471-1.333L27.085 3zM4.915 3l-1.886.666L3.5 5h1.415V3zm-1.886.334A.5.5 0 013.5 3v4a3.5 3.5 0 003.3-2.334L3.03 3.334zM27.085 2H4.915v4h22.17V2zM28.5 3a.5.5 0 01.471.333L25.2 4.667A3.5 3.5 0 0028.5 7V3zm-.5.5a.5.5 0 01.5-.5v4A3.5 3.5 0 0032 3.5h-4zm.5.5a.5.5 0 01-.5-.5h4A3.5 3.5 0 0028.5 0v4zm.471-.333A.5.5 0 0128.5 4V0a3.5 3.5 0 00-3.3 2.333l3.771 1.333zM4.915 5h22.17V1H4.915v4zM3.5 4a.5.5 0 01-.471-.334L6.8 2.334A3.5 3.5 0 003.5 0v4zm.5-.5a.5.5 0 01-.5.5V0A3.5 3.5 0 000 3.5h4zM3.5 3a.5.5 0 01.5.5H0A3.5 3.5 0 003.5 7V3z", mask: "url(#a)" })));
};

const PadlockBox = () => {
    return (index.h("svg", { xmlns: "http://www.w3.org/2000/svg", width: "64", height: "64", fill: "none", viewBox: "0 0 64 64" },
        index.h("path", { d: "M0 25.6C0 16.6392 0 12.1587 1.7439 8.73615C3.27787 5.72556 5.72556 3.27787 8.73615 1.7439C12.1587 0 16.6392 0 25.6 0L38.4 0C47.3608 0 51.8413 0 55.2638 1.7439C58.2744 3.27787 60.7221 5.72556 62.2561 8.73615C64 12.1587 64 16.6392 64 25.6V38.4C64 47.3608 64 51.8413 62.2561 55.2638C60.7221 58.2744 58.2744 60.7221 55.2638 62.2561C51.8413 64 47.3608 64 38.4 64H25.6C16.6392 64 12.1587 64 8.73615 62.2561C5.72556 60.7221 3.27787 58.2744 1.7439 55.2638C0 51.8413 0 47.3608 0 38.4L0 25.6Z", fill: "#E3E5FF" }),
        index.h("path", { d: "M40.7273 26.7143H39.6364V23.5C39.6364 21.5109 38.8318 19.6032 37.3997 18.1967C35.9676 16.7902 34.0253 16 32 16C29.9747 16 28.0324 16.7902 26.6003 18.1967C25.1682 19.6032 24.3636 21.5109 24.3636 23.5V26.7143H23.2727C22.405 26.7152 21.5732 27.0542 20.9596 27.6568C20.3461 28.2594 20.001 29.0764 20 29.9286V42.7857C20.001 43.6379 20.3461 44.4549 20.9596 45.0575C21.5732 45.6601 22.405 45.9991 23.2727 46H40.7273C41.595 45.9991 42.4268 45.6601 43.0404 45.0575C43.6539 44.4549 43.999 43.6379 44 42.7857V29.9286C43.999 29.0764 43.6539 28.2594 43.0404 27.6568C42.4268 27.0542 41.595 26.7152 40.7273 26.7143ZM26.5455 23.5C26.5455 22.0792 27.1201 20.7166 28.1431 19.7119C29.166 18.7073 30.5534 18.1429 32 18.1429C33.4466 18.1429 34.834 18.7073 35.8569 19.7119C36.8799 20.7166 37.4545 22.0792 37.4545 23.5V26.7143H26.5455V23.5Z", fill: "#3700FF" })));
};

const isChrome = () => {
    const isChromium = !!window['chrome'];
    const winNav = window.navigator;
    const vendorName = winNav.vendor;
    const isOpera = typeof window.opr !== 'undefined';
    const isIEedge = winNav.userAgent.includes('Edge');
    const isIOSChrome = /CriOS/.exec(winNav.userAgent);
    if (isIOSChrome) {
        return false;
    }
    else if (isChromium !== null &&
        typeof isChromium !== 'undefined' &&
        vendorName === 'Google Inc.' &&
        isOpera === false &&
        isIEedge === false) {
        return true;
    }
    else {
        return false;
    }
};
const getBrowser = () => {
    if (isChrome()) {
        return 'Chrome';
    }
    else if (window.navigator.userAgent.includes('Firefox')) {
        return 'Firefox';
    }
    return null;
};
const onClick = () => {
    const browser = getBrowser();
    if (browser === 'Firefox') {
        window.open('https://addons.mozilla.org/en-US/firefox/addon/blockstack/', '_blank');
    }
    else if (browser === 'Chrome') {
        window.open('https://chrome.google.com/webstore/detail/blockstack/mdhmgoflnkccjhcfbojdagggmklgfloo', '_blank');
    }
};

const Intro = ({ authOptions, signUp, signIn }) => {
    return (index.h("div", null,
        index.h("div", { class: "app-element-container" },
            index.h("div", { class: "app-element-app-icon" },
                index.h("img", { src: authOptions.appDetails.icon, alt: "Testing App" })),
            index.h("div", { class: "app-element-link" },
                index.h(LinkIcon, null)),
            index.h("div", { class: "app-element-lock" },
                index.h(PadlockBox, null))),
        index.h("span", { class: "modal-header pxl" },
            authOptions.appDetails.name,
            " guarantees your privacy by encrypting everything"),
        index.h("div", { class: "divider" }),
        index.h("div", { class: "intro-entry" },
            index.h("div", { class: "intro-entry-icon" },
                index.h(PadlockIcon, null)),
            index.h("span", { class: "intro-entry-copy" }, "You'll get a Secret Key that automatically encrypts everything you do")),
        index.h("div", { class: "divider" }),
        index.h("div", { class: "intro-entry" },
            index.h("div", { class: "intro-entry-icon" },
                index.h(EyeIcon, null)),
            index.h("span", { class: "intro-entry-copy" },
                authOptions.appDetails.name,
                " won't be able to see, access, or track your activity")),
        index.h("div", { class: "button-container" },
            index.h("button", { class: "button", onClick: () => {
                    signUp.emit();
                } },
                index.h("span", null, "Get your Secret Key"))),
        index.h("div", { class: "modal-footer" },
            index.h("span", { class: "link", onClick: () => signIn.emit() }, "Sign in"),
            index.h("span", { class: "link", onClick: () => (state.screen = Screens.HOW_IT_WORKS) }, "How it works"),
            getBrowser() ? (index.h("span", { class: "link", onClick: onClick }, "Install extension")) : null)));
};

const MiniBlockstackIcon = () => {
    return (index.h("svg", { width: "12", height: "12", viewBox: "0 0 12 12", fill: "none", class: "vector___c5-sc-63utmo-0 bMjcgD" },
        index.h("path", { "fill-rule": "evenodd", "clip-rule": "evenodd", d: "M0.148042 1.08513C-5.58794e-08 1.42724 -3.80998e-08 1.86349 0 2.736L1.42713e-07 6L2.85387e-07 9.264C3.23525e-07 10.1365 0 10.5728 0.148042 10.9149C0.329866 11.335 0.664964 11.6701 1.08513 11.852C1.42724 12 1.86349 12 2.736 12H6H9.264C10.1365 12 10.5728 12 10.9149 11.852C11.335 11.6701 11.6701 11.335 11.852 10.9149C12 10.5728 12 10.1365 12 9.264V6V2.736C12 1.86349 12 1.42724 11.852 1.08513C11.6701 0.664963 11.335 0.329865 10.9149 0.148041C10.5728 -6.70552e-08 10.1365 -3.80998e-08 9.264 0L6 1.42713e-07L2.736 2.85387e-07C1.86349 3.23525e-07 1.40625 2.90573e-07 1.08513 0.148042C0.664964 0.329867 0.329866 0.664963 0.148042 1.08513ZM7.91566 5.16965C7.31682 5.16965 6.83125 4.68409 6.83125 4.08511C6.83125 3.48644 7.31682 3.00088 7.91566 3.00088C8.5145 3.00088 9.00007 3.48644 9.00007 4.08511C9.00007 4.68409 8.5145 5.16965 7.91566 5.16965ZM5.16787 4.085C5.16787 4.68358 4.68253 5.16893 4.08382 5.16893C3.48541 5.16893 3.00007 4.68358 3.00007 4.085C3.00007 3.48643 3.48541 3.00107 4.08382 3.00107C4.68253 3.00107 5.16787 3.48643 5.16787 4.085ZM7.91576 6.83459C7.31679 6.83459 6.83123 7.32016 6.83123 7.919C6.83123 8.51785 7.31679 9.00342 7.91576 9.00342C8.51444 9.00342 9 8.51785 9 7.919C9 7.32016 8.51444 6.83459 7.91576 6.83459ZM4.08392 6.83565C4.68248 6.83565 5.16783 7.32098 5.16783 7.91969C5.16783 8.51809 4.68248 9.00342 4.08392 9.00342C3.48535 9.00342 3 8.51809 3 7.91969C3 7.32098 3.48535 6.83565 4.08392 6.83565Z", fill: "#A1A7B3" })));
};

const HowItWorks = ({ signUp }) => {
    return (index.h("div", null,
        index.h("div", { class: "how-it-works" },
            index.h("div", { class: "label" }, "How it works"),
            index.h("span", { class: "modal-header" }, "Testing App guarantees your privacy by encrypting everything"),
            index.h("span", { class: "hiw-content" }, "Normally, apps keep your data for them to use. When you have a Secret Key, you no longer have to trust Testing App with your data because Testing App won't have access."),
            index.h("span", { class: "hiw-question" }, "What is Blockstack?"),
            index.h("span", { class: "hiw-content" },
                "Blockstack is the open-source technology that generates your Secret Key. There's no company that owns or controls Blockstack, it is independent. Go to",
                ' ',
                index.h("a", { href: "https://blockstack.org", target: "_blank", class: "link link-l" }, "blockstack.org"),
                ' ',
                "to learn more."),
            index.h("span", { class: "hiw-question" }, "Encryption"),
            index.h("span", { class: "hiw-content" }, "Encryption is always on. It locks everything you do in Testing App into useless codes. Because of this, Testing App can\u2019t see or track your activity. Your data can only be unlocked with the key that you own. No one else has this key, not even Testing App, so no one else can unlock your data"),
            index.h("span", { class: "hiw-question" }, "What is a Secret Key?"),
            index.h("span", { class: "hiw-content" }, "Your Secret Key unlocks your data. It's created independently from Testing App to make sure that Testing App doesn't have it. An open-source protocol called Blockstack generates your Secret Key when you sign up. Nobody but you will have your Secret Key, to make sure that only you have access to your data."),
            index.h("span", { class: "hiw-question" }, "When will I need my Secret Key?"),
            index.h("span", { class: "hiw-content" }, "You\u2019ll need your Secret Key to prove it\u2019s you when you use Testing App on a new device, such as a new phone or laptop. After that, your Secret Key will stay active to keep you safe and private in the apps you use on that device.")),
        index.h("div", { class: "button-container" },
            index.h("button", { class: "button", onClick: () => signUp.emit() },
                index.h("span", null, "Get your Secret Key"))),
        index.h("div", { class: "powered-by-container" },
            index.h("a", { class: "powered-by", href: "https://blockstack.org", target: "_blank" },
                "Powered by",
                index.h(MiniBlockstackIcon, null),
                "Blockstack"))));
};

const modalCss = ":host{all:initial}.modal-container{display:-ms-flexbox;display:flex;-ms-flex-direction:column;flex-direction:column;background-color:rgba(0, 0, 0, 0.48);width:100%;height:100%;position:fixed;top:0px;left:0px;-ms-flex-pack:center;justify-content:center;font-family:\"Inter\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Helvetica, Arial, sans-serif, \"Apple Color Emoji\", \"Segoe UI Emoji\", \"Segoe UI Symbol\";z-index:8999}.modal-body{width:398px;max-width:100%;max-height:calc(100% - 48px);background:white;-ms-flex-direction:column;flex-direction:column;display:-ms-flexbox;display:flex;margin-left:auto;margin-right:auto;border-radius:6px}.modal-body .pxl{padding-left:24px;padding-right:24px}.modal-body div{-webkit-box-sizing:border-box;box-sizing:border-box}.pxl{padding-left:32px;padding-right:32px}.modal-top{display:-ms-flexbox;display:flex;-ms-flex-align:center;align-items:center;-ms-flex-pack:justify;justify-content:space-between;padding:16px}.modal-top svg{cursor:pointer}.modal-content{overflow-y:auto}.modal-header{font-size:20px;font-weight:500;line-height:28px;padding:10px 32px;display:block;text-align:center}.divider{margin:8px 0;-webkit-box-sizing:border-box;box-sizing:border-box;width:100%;height:1px;background:#E5E5EC}.intro-entry{display:-ms-flexbox;display:flex;width:100%;-ms-flex-align:center;align-items:center;padding:20px 32px;-webkit-box-sizing:border-box;box-sizing:border-box}.intro-entry-icon{-ms-flex-item-align:stretch;align-self:stretch;margin-top:4px;margin-right:16px}.intro-entry-copy{display:inline;font-size:14px;line-height:20px;color:#222933;white-space:unset}.button-container{padding:10px 24px;width:100%;-webkit-box-sizing:border-box;box-sizing:border-box}.button{width:100%;-webkit-box-sizing:border-box;box-sizing:border-box;border-radius:6px;display:-ms-inline-flexbox;display:inline-flex;line-height:1.333;-ms-flex-align:center;align-items:center;-ms-flex-pack:center;justify-content:center;background-color:#3700ff;color:#ffffff;min-height:48px;min-width:126px;font-size:14px !important;padding-left:20px;padding-right:20px;-webkit-appearance:none;-moz-appearance:none;appearance:none;-webkit-transition:all 250ms;transition:all 250ms;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;white-space:nowrap;outline:none;border:none;cursor:pointer}.button span{-ms-flex-align:center;align-items:center;-webkit-box-pack:center;font-weight:500;line-height:1.333;color:#ffffff;font-size:14px !important;white-space:nowrap}.modal-footer{display:-ms-flexbox;display:flex;-ms-flex-direction:row;flex-direction:row;margin-bottom:20px;margin-top:10px;padding:0 24px}.link{color:#3700ff;margin-right:16px;font-weight:500;display:inline;font-size:12px;line-height:1.333;-webkit-letter-spacing:0em;-moz-letter-spacing:0em;-ms-letter-spacing:0em;letter-spacing:0em;white-space:unset;cursor:pointer;text-decoration:none}.link:hover{text-decoration:underline}.link-l{font-size:14px}.app-element-container{margin:24px auto;display:-ms-flexbox;display:flex;position:relative;width:152px}.app-element-app-icon{overflow:hidden;width:64px;height:64px;margin-right:24px}.app-element-app-icon img{max-width:100%}.app-element-link{position:absolute;left:50%;top:50%;margin-left:-16px;margin-top:-12px}.how-it-works{padding:24px;border-top:1px solid #e5e5ec;width:100%}.how-it-works .modal-header{padding-left:0;padding-right:0;padding-top:3px;padding-bottom:10px}.label{display:block;width:100%;line-height:20px;font-size:11px;text-transform:uppercase;color:#677282}.hiw-content{display:block;margin-top:8px;font-size:14px;line-height:20px}.hiw-content .link{margin:0}.hiw-question{display:block;margin-top:32px;font-size:14px;line-height:20px;font-weight:500}.powered-by-container{width:100%;padding:24px;text-align:center}.powered-by-container .powered-by{color:#677282;font-size:12px;text-decoration:none}.powered-by-container .powered-by:hover{text-decoration:underline;cursor:pointer}.powered-by-container .powered-by svg{position:relative;top:2px;display:inline-block;margin:0 4px}";

const Modal = class {
    constructor(hostRef) {
        index.registerInstance(this, hostRef);
        this.onSignUp = index.createEvent(this, "onSignUp", 7);
        this.onSignIn = index.createEvent(this, "onSignIn", 7);
        this.onCloseModal = index.createEvent(this, "onCloseModal", 7);
    }
    render() {
        const handleContainerClick = (event) => {
            var _a;
            const target = event.target;
            if (((_a = target.className) === null || _a === void 0 ? void 0 : _a.includes) && target.className.includes('modal-container')) {
                this.onCloseModal.emit();
            }
        };
        return (index.h("div", { class: "modal-container", onClick: handleContainerClick }, index.h("div", { class: "modal-body" }, index.h("div", { class: "modal-top" }, state.screen === Screens.HOW_IT_WORKS ? index.h(ChevronIcon, null) : null, index.h("div", null), state.screen !== Screens.HOW_IT_WORKS ? (index.h(CloseIcon, { onClick: () => this.onCloseModal.emit() })) : null), index.h("div", { class: "modal-content" }, state.screen === Screens.INTRO && (index.h(Intro, { authOptions: this.authOptions, signUp: this.onSignUp, signIn: this.onSignIn })), state.screen === Screens.HOW_IT_WORKS && index.h(HowItWorks, { signUp: this.onSignUp })))));
    }
    static get assetsDirs() { return ["screens", "assets"]; }
};
Modal.style = modalCss;

exports.connect_modal = Modal;
