import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';


@Injectable()
export class CognitoAuthGuard extends AuthGuard('jwt') {

  /*handleRequest(err, user, info, context) {
    const req = context.switchToHttp().getRequest();
    if (err || !user) {
      throw err || new UnauthorizedException();
    }
    return user;
  }*/
  handleRequest(err, user, info, context) {
    const req = context.switchToHttp().getRequest();
	  const apiKey = req.headers['x-api-key'];
	  
	  console.log('Headers:', req.headers);
	  console.log('Decoded User:', user);
	  console.log('Error:', err);

	  if (apiKey) {
	    return user; 
	  }

	  if (err || !user) {
	    throw err || new UnauthorizedException();
	  }

	  // Extract username properly
	  user.username = user.username || user['cognito:username'] || user.sub; 

	  return user;
  }
}

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {}

@Injectable()
export class GithubAuthGuard extends AuthGuard('github') {}
