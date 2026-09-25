import { AuthService } from './auth.service';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    signup(body: any): Promise<{
        token: any;
    }>;
    signin(body: any): Promise<{
        token: any;
    }>;
}
