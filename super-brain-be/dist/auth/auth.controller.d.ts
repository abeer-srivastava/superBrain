import type { Response } from 'express';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { type AuthUser } from '../common/http/validation';
export declare class AuthController {
    private readonly authService;
    private readonly userService;
    constructor(authService: AuthService, userService: UserService);
    signup(body: unknown, res: Response): Promise<{
        user: import("../user/user.service").PublicUser;
    }>;
    signin(body: unknown, res: Response): Promise<{
        user: import("../user/user.service").PublicUser;
    }>;
    signout(res: Response): {
        ok: boolean;
    };
    signoutAll(user: AuthUser, res: Response): Promise<{
        ok: boolean;
    }>;
    me(user: AuthUser): Promise<{
        user: import("../user/user.service").PublicUser;
    }>;
}
