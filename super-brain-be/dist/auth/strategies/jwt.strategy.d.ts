import { ConfigService } from '@nestjs/config';
import { UserService } from '../../user/user.service';
declare const JwtStrategy_base: any;
export declare class JwtStrategy extends JwtStrategy_base {
    private configService;
    private userService;
    constructor(configService: ConfigService, userService: UserService);
    validate(payload: any): Promise<{
        userId: any;
        username: any;
    }>;
}
export {};
