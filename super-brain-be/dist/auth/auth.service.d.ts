import { JwtService } from '@nestjs/jwt';
import type { Response } from 'express';
import { UserService } from '../user/user.service';
import type { UserDocument } from '../user/schemas/user.schema';
import { SigninDto, SignupDto } from './dto/auth.dto';
export declare const SESSION_COOKIE = "sb_session";
export interface JwtPayload {
    sub: string;
    username: string;
    tv: number;
}
export declare class AuthService {
    private readonly userService;
    private readonly jwtService;
    constructor(userService: UserService, jwtService: JwtService);
    signup(dto: SignupDto): Promise<UserDocument>;
    validateCredentials(dto: SigninDto): Promise<UserDocument>;
    verifyPassword(userId: string, password: string): Promise<UserDocument>;
    hashPassword(password: string): Promise<string>;
    issueToken(user: UserDocument): string;
    private cookieOptions;
    setSessionCookie(res: Response, user: UserDocument): void;
    clearSessionCookie(res: Response): void;
}
