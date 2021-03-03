import { Component, h, Prop, Event } from '@stencil/core';
import { state, Screens } from '../../store';
import { CloseIcon } from './assets/close-icon';
import { ChevronIcon } from './assets/chevron-icon';
import { Intro } from './screens/screens-intro';
import { HowItWorks } from './screens/screens-how-it-works';
export class Modal {
    render() {
        const handleContainerClick = (event) => {
            var _a;
            const target = event.target;
            if (((_a = target.className) === null || _a === void 0 ? void 0 : _a.includes) && target.className.includes('modal-container')) {
                this.onCloseModal.emit();
            }
        };
        return (h("div", { class: "modal-container", onClick: handleContainerClick },
            h("div", { class: "modal-body" },
                h("div", { class: "modal-top" },
                    state.screen === Screens.HOW_IT_WORKS ? h(ChevronIcon, null) : null,
                    h("div", null),
                    state.screen !== Screens.HOW_IT_WORKS ? (h(CloseIcon, { onClick: () => this.onCloseModal.emit() })) : null),
                h("div", { class: "modal-content" },
                    state.screen === Screens.INTRO && (h(Intro, { authOptions: this.authOptions, signUp: this.onSignUp, signIn: this.onSignIn })),
                    state.screen === Screens.HOW_IT_WORKS && h(HowItWorks, { signUp: this.onSignUp })))));
    }
    static get is() { return "connect-modal"; }
    static get encapsulation() { return "shadow"; }
    static get originalStyleUrls() { return {
        "$": ["modal.scss"]
    }; }
    static get styleUrls() { return {
        "$": ["modal.css"]
    }; }
    static get assetsDirs() { return ["screens", "assets"]; }
    static get properties() { return {
        "authOptions": {
            "type": "unknown",
            "mutable": false,
            "complexType": {
                "original": "AuthOptions",
                "resolved": "AuthOptions",
                "references": {
                    "AuthOptions": {
                        "location": "import",
                        "path": "@stacks/connect/auth"
                    }
                }
            },
            "required": false,
            "optional": false,
            "docs": {
                "tags": [],
                "text": ""
            }
        }
    }; }
    static get events() { return [{
            "method": "onSignUp",
            "name": "onSignUp",
            "bubbles": true,
            "cancelable": true,
            "composed": true,
            "docs": {
                "tags": [],
                "text": ""
            },
            "complexType": {
                "original": "any",
                "resolved": "any",
                "references": {}
            }
        }, {
            "method": "onSignIn",
            "name": "onSignIn",
            "bubbles": true,
            "cancelable": true,
            "composed": true,
            "docs": {
                "tags": [],
                "text": ""
            },
            "complexType": {
                "original": "any",
                "resolved": "any",
                "references": {}
            }
        }, {
            "method": "onCloseModal",
            "name": "onCloseModal",
            "bubbles": true,
            "cancelable": true,
            "composed": true,
            "docs": {
                "tags": [],
                "text": ""
            },
            "complexType": {
                "original": "any",
                "resolved": "any",
                "references": {}
            }
        }]; }
}
