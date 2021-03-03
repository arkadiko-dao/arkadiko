import { UserSession } from 'blockstack';
import './types';
export declare const defaultAuthURL = "https://app.blockstack.org";
export interface FinishedData {
    authResponse: string;
    userSession: UserSession;
}
export interface AuthOptions {
    /** The URL you want the user to be redirected to after authentication. */
    redirectTo?: string;
    manifestPath?: string;
    /** DEPRECATED: use `onFinish` */
    finished?: (payload: FinishedData) => void;
    /**
     * This callback is fired after authentication is finished.
     * The callback is called with a single object argument, with two keys:
     * `userSession`: a UserSession object with `userData` included
     * `authResponse`: the raw `authResponse` string that is returned from authentication
     * */
    onFinish?: (payload: FinishedData) => void;
    /** This callback is fired if the user exits before finishing */
    onCancel?: () => void;
    authOrigin?: string;
    sendToSignIn?: boolean;
    userSession?: UserSession;
    appDetails: {
        name: string;
        icon: string;
    };
}
export declare const isMobile: () => boolean;
/**
 * mobile should not use a 'popup' type of window.
 */
export declare const shouldUsePopup: () => boolean;
export declare const getOrCreateUserSession: (userSession?: UserSession) => UserSession;
export declare const authenticate: ({ redirectTo, manifestPath, finished, onFinish, onCancel, authOrigin, sendToSignIn, userSession: _userSession, appDetails, }: AuthOptions) => Promise<void>;
export declare const getUserData: (userSession?: UserSession) => Promise<import("blockstack/lib/auth/authApp").UserData>;
