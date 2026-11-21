import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import type { Response, CookieOptions } from 'express';
import { UserService } from '../user/user.service';
import type { UserDocument } from '../user/schemas/user.schema';
import { SigninDto, SignupDto } from './dto/auth.dto';
import { env } from '../config/env';

export const SESSION_COOKIE = 'sb_session';
const BCRYPT_ROUNDS = 12;

/** Pre-computed hash used to equalise timing when a user does not exist. */
const DUMMY_HASH = bcrypt.hashSync('superbrain-timing-equaliser', 10);

export interface JwtPayload {
  sub: string;
  username: string;
  tv: number;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async signup(dto: SignupDto): Promise<UserDocument> {
    const [byName, byEmail] = await Promise.all([
      this.userService.findByUsername(dto.username),
      this.userService.findByEmail(dto.email),
    ]);
    if (byName) throw new ConflictException({ message: 'That username is taken', errors: [{ path: 'username', message: 'That username is taken' }] });
    if (byEmail) throw new ConflictException({ message: 'An account with that email already exists', errors: [{ path: 'email', message: 'An account with that email already exists' }] });

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    try {
      return await this.userService.create({ email: dto.email, username: dto.username, passwordHash });
    } catch (err: any) {
      if (err?.code === 11000) throw new ConflictException('That username or email is already registered');
      throw err;
    }
  }

  async validateCredentials(dto: SigninDto): Promise<UserDocument> {
    const user = await this.userService.findByIdentifierWithSecret(dto.identifier);
    const ok = await bcrypt.compare(dto.password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !ok) throw new UnauthorizedException('Incorrect username/email or password');
    return user;
  }

  async verifyPassword(userId: string, password: string): Promise<UserDocument> {
    const user = await this.userService.findByIdWithSecret(userId);
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Incorrect password');
    }
    return user;
  }

  hashPassword(password: string) {
    return bcrypt.hash(password, BCRYPT_ROUNDS);
  }

  issueToken(user: UserDocument): string {
    const payload: JwtPayload = { sub: user._id.toString(), username: user.username, tv: user.tokenVersion ?? 0 };
    return this.jwtService.sign(payload);
  }

  private cookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: env().NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    };
  }

  setSessionCookie(res: Response, user: UserDocument) {
    res.cookie(SESSION_COOKIE, this.issueToken(user), {
      ...this.cookieOptions(),
      maxAge: env().SESSION_TTL_DAYS * 24 * 60 * 60 * 1000,
    });
  }

  clearSessionCookie(res: Response) {
    res.clearCookie(SESSION_COOKIE, this.cookieOptions());
  }
}
