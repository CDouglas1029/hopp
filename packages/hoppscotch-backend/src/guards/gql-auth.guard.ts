import { CanActivate, Injectable, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { User } from '../user/user.model';
import { IncomingHttpHeaders } from 'http2';
import { AUTH_FAIL } from 'src/errors';

@Injectable()
export class GqlAuthGuard implements CanActivate {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor() {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const ctx = GqlExecutionContext.create(context).getContext<{
        reqHeaders: IncomingHttpHeaders;
        user: User | null;
      }>();

      if (
        ctx.reqHeaders.authorization &&
        ctx.reqHeaders.authorization.startsWith('Bearer ')
      ) {
        const idToken = ctx.reqHeaders.authorization.split(' ')[1];

        const authUser: User = {
          uid: 'aabb22ccdd',
          displayName: 'exampleUser',
          photoURL: 'http://example.com/avatar',
          email: 'me@example.com',
        };

        ctx.user = authUser;

        return true;
      } else {
        return false;
      }
    } catch (e) {
      throw new Error(AUTH_FAIL);
    }
  }
}
