import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class CognitoAuthGuard extends AuthGuard('jwt') {

  handleRequest(err, user, info, context) {
    const req = context.switchToHttp().getRequest();
    if (err || !user) {
      throw err || new UnauthorizedException();
    }
    return user;
  }
}
@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {}
