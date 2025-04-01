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
  /*handleRequest(err, user, info, context) {
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
  }*/
  handleRequest(err, user, info, context) {
    const req = context.switchToHttp().getRequest();
    const apiKey = req.headers['x-api-key'];

    console.log('Decoded Cognito User:', user);
    console.log('Authentication Error:', err);

    if (apiKey) {
      console.log('API Key provided, skipping authentication check.');
      return user;
    }

    if (err || !user) {
      console.error('Authentication failed:', err || 'User not found');
      throw err || new UnauthorizedException('Invalid or missing authentication token');
    }

    // Extract username correctly
    user.username = user.username || user['cognito:username'] || user.sub || user.email;

    console.log('Final Authenticated User:', user);
    return user;
  }
}

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {}

@Injectable()
export class GithubAuthGuard extends AuthGuard('github') {}
