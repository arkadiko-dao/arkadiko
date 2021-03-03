import { h } from '@stencil/core';
import { PadlockIcon } from '../assets/padlock-icon';
import { EyeIcon } from '../assets/eye-icon';
import { state, Screens } from '../../../store';
import { LinkIcon } from '../assets/link-icon';
import { PadlockBox } from '../assets/padlock-box';
import { onClick as onExtensionClick, getBrowser } from '../extension-util';
export const Intro = ({ authOptions, signUp, signIn }) => {
    return (h("div", null,
        h("div", { class: "app-element-container" },
            h("div", { class: "app-element-app-icon" },
                h("img", { src: authOptions.appDetails.icon, alt: "Testing App" })),
            h("div", { class: "app-element-link" },
                h(LinkIcon, null)),
            h("div", { class: "app-element-lock" },
                h(PadlockBox, null))),
        h("span", { class: "modal-header pxl" },
            authOptions.appDetails.name,
            " guarantees your privacy by encrypting everything"),
        h("div", { class: "divider" }),
        h("div", { class: "intro-entry" },
            h("div", { class: "intro-entry-icon" },
                h(PadlockIcon, null)),
            h("span", { class: "intro-entry-copy" }, "You'll get a Secret Key that automatically encrypts everything you do")),
        h("div", { class: "divider" }),
        h("div", { class: "intro-entry" },
            h("div", { class: "intro-entry-icon" },
                h(EyeIcon, null)),
            h("span", { class: "intro-entry-copy" },
                authOptions.appDetails.name,
                " won't be able to see, access, or track your activity")),
        h("div", { class: "button-container" },
            h("button", { class: "button", onClick: () => {
                    signUp.emit();
                } },
                h("span", null, "Get your Secret Key"))),
        h("div", { class: "modal-footer" },
            h("span", { class: "link", onClick: () => signIn.emit() }, "Sign in"),
            h("span", { class: "link", onClick: () => (state.screen = Screens.HOW_IT_WORKS) }, "How it works"),
            getBrowser() ? (h("span", { class: "link", onClick: onExtensionClick }, "Install extension")) : null)));
};
