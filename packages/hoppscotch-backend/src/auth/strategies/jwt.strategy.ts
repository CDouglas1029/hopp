import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import {
  Injectable,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { AccessTokenPayload } from 'src/types/AuthTokens';
import { UserService } from 'src/user/user.service';
import { AuthService } from '../auth.service';
import { Request } from 'express';
import * as O from 'fp-ts/Option';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private usersService: UserService,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          const ATCookie = request.cookies['access_token'];
          if (!ATCookie) {
            throw new ForbiddenException('No cookies present');
          }
          return ATCookie;
        },
      ]),
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: AccessTokenPayload) {
    if (!payload) throw new ForbiddenException('Access token malformed');

    const user = await this.usersService.findUserById(payload.sub);

    if (O.isNone(user)) {
      throw new UnauthorizedException('User not found');
    }

    const profile = {
      provider: 'email',
      id: user.value.email,
    };

    const providerAccountExists =
      await this.authService.checkIfProviderAccountExists(user.value, profile);

    if (!providerAccountExists)
      await this.usersService.createProviderAccount(
        user.value,
        null,
        null,
        profile,
      );

    return user.value;
  }
}
