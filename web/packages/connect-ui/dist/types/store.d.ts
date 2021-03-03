export declare enum Screens {
    INTRO = "INTRO",
    HOW_IT_WORKS = "HOW_IT_WORKS",
    FINISHED = "FINISHED"
}
interface AppState {
    screen: Screens;
}
export declare const state: AppState;
export {};
