import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import * as O from 'fp-ts/Option';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy) {
  constructor(private usersService: UserService) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      scope: process.env.GOOGLE_SCOPE.split(','),
    });
  }

  async validate(accessToken, refreshToken, profile, done: VerifyCallback) {
    const user = await this.usersService.findUserByEmail(
      profile.emails[0].value,
    );
    console.log('user log', user);

    if (O.isNone(user)) {
      const createdUser = await this.usersService.createUserSSO(
        accessToken,
        refreshToken,
        profile,
      );
      return createdUser;
    }

    return user.value;
  }
}
