

@types/passport-local 으로 해도 되지만, 내 프로젝트에서 사용하는 type을 직접 선언할 수 있음

declare module "passport-local" {
    import { Strategy as PassportStrategy } from 'passport';
    export interface IVerifyOptions {
        [key: string] : any;
    }
    export interface IStrategyOptions {
        usernameField : string;
        passwordField : string;


    }
    export interface Done {
        (error: Error | null, user?: any, options?: IVerifyOptions) : void;
    }
    export interface VerifyFunction {
        (username: string, password: string, done: Done) : void | Promise<any>;
    }

    export class Strategy extends PassportStrategy {
        constructor(options: IStrategyOptions, verify: VerifyFunction)
    }
}