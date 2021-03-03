import { createStore } from '@stencil/store';
export var Screens;
(function (Screens) {
    Screens["INTRO"] = "INTRO";
    Screens["HOW_IT_WORKS"] = "HOW_IT_WORKS";
    Screens["FINISHED"] = "FINISHED";
})(Screens || (Screens = {}));
export const { state } = createStore({
    screen: Screens.INTRO,
});
