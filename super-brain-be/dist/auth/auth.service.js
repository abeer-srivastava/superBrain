"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = exports.SESSION_COOKIE = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcrypt"));
const user_service_1 = require("../user/user.service");
const env_1 = require("../config/env");
exports.SESSION_COOKIE = 'sb_session';
const BCRYPT_ROUNDS = 12;
const DUMMY_HASH = bcrypt.hashSync('superbrain-timing-equaliser', 10);
let AuthService = class AuthService {
    userService;
    jwtService;
    constructor(userService, jwtService) {
        this.userService = userService;
        this.jwtService = jwtService;
    }
    async signup(dto) {
        const [byName, byEmail] = await Promise.all([
            this.userService.findByUsername(dto.username),
            this.userService.findByEmail(dto.email),
        ]);
        if (byName)
            throw new common_1.ConflictException({ message: 'That username is taken', errors: [{ path: 'username', message: 'That username is taken' }] });
        if (byEmail)
            throw new common_1.ConflictException({ message: 'An account with that email already exists', errors: [{ path: 'email', message: 'An account with that email already exists' }] });
        const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
        try {
            return await this.userService.create({ email: dto.email, username: dto.username, passwordHash });
        }
        catch (err) {
            if (err?.code === 11000)
                throw new common_1.ConflictException('That username or email is already registered');
            throw err;
        }
    }
    async validateCredentials(dto) {
        const user = await this.userService.findByIdentifierWithSecret(dto.identifier);
        const ok = await bcrypt.compare(dto.password, user?.passwordHash ?? DUMMY_HASH);
        if (!user || !ok)
            throw new common_1.UnauthorizedException('Incorrect username/email or password');
        return user;
    }
    async verifyPassword(userId, password) {
        const user = await this.userService.findByIdWithSecret(userId);
        if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
            throw new common_1.UnauthorizedException('Incorrect password');
        }
        return user;
    }
    hashPassword(password) {
        return bcrypt.hash(password, BCRYPT_ROUNDS);
    }
    issueToken(user) {
        const payload = { sub: user._id.toString(), username: user.username, tv: user.tokenVersion ?? 0 };
        return this.jwtService.sign(payload);
    }
    cookieOptions() {
        return {
            httpOnly: true,
            secure: (0, env_1.env)().NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
        };
    }
    setSessionCookie(res, user) {
        res.cookie(exports.SESSION_COOKIE, this.issueToken(user), {
            ...this.cookieOptions(),
            maxAge: (0, env_1.env)().SESSION_TTL_DAYS * 24 * 60 * 60 * 1000,
        });
    }
    clearSessionCookie(res) {
        res.clearCookie(exports.SESSION_COOKIE, this.cookieOptions());
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [user_service_1.UserService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map