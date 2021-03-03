import { EventEmitter } from '../../../stencil-public-runtime';
import { AuthOptions } from '@stacks/connect/auth';
interface IntroProps {
    authOptions: AuthOptions;
    signUp: EventEmitter;
    signIn: EventEmitter;
}
export declare const Intro: ({ authOptions, signUp, signIn }: IntroProps) => any;
export {};
