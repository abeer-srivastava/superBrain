import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { SignupDto, SigninDto } from './dto/auth.dto';
export declare class AuthService {
    private userService;
    private jwtService;
    constructor(userService: UserService, jwtService: JwtService);
    signup(signupDto: SignupDto): Promise<{
        token: string;
    }>;
    signin(signinDto: SigninDto): Promise<{
        token: string;
    }>;
    private generateToken;
}
