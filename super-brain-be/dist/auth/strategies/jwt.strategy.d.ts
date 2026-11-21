import { Strategy } from 'passport-jwt';
import { UserService } from '../../user/user.service';
import { type JwtPayload } from '../auth.service';
import type { AuthUser } from '../../common/http/validation';
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    private readonly userService;
    constructor(userService: UserService);
    validate(payload: JwtPayload): Promise<AuthUser>;
}
export {};
