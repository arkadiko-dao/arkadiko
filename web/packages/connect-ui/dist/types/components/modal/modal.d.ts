import { EventEmitter } from '../../stencil-public-runtime';
import { AuthOptions } from '@stacks/connect/auth';
export declare class Modal {
    authOptions: AuthOptions;
    onSignUp: EventEmitter;
    onSignIn: EventEmitter;
    onCloseModal: EventEmitter;
    render(): any;
}
