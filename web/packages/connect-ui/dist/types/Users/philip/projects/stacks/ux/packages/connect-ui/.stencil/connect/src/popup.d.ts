interface PopupOptions {
    url?: string;
    title?: string;
    w?: number;
    h?: number;
    skipPopupFallback?: boolean;
}
export declare const popupCenter: ({ url, title, w, h, skipPopupFallback, }: PopupOptions) => Window;
interface ListenerParams<FinishedType> {
    popup: Window | null;
    messageParams: {
        [key: string]: any;
    };
    onFinish: (payload: FinishedType) => void | Promise<void>;
    onCancel?: () => void;
    authURL: URL;
}
export declare const setupListener: <T>({ popup, messageParams, onFinish, onCancel, authURL, }: ListenerParams<T>) => void;
export {};
