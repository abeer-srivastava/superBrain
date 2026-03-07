import { AuthService } from './auth.service';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    signup(body: any): Promise<{
        token: string;
    }>;
    signin(body: any): Promise<{
        token: string;
    }>;
}
