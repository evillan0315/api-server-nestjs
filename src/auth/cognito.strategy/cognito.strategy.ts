import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import * as dotenv from 'dotenv';
import * as jwksClient from 'jwks-rsa';
import * as jwt from 'jsonwebtoken';  // Add this import

dotenv.config();

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const client = jwksClient({
      jwksUri: `https://cognito-idp.${process.env.AWS_REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}/.well-known/jwks.json`,
    });

    super({
      ///jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      jwtFromRequest: (req) => {
	  if (req && req.cookies) {
	    return req.cookies['access_token'];  // Use the correct cookie name
	  }
	  return null;
      },
      secretOrKeyProvider: (request, rawJwtToken, done) => {
        // Decode the JWT to get the kid (key ID)
        const decodedJwt = jwt.decode(rawJwtToken, { complete: true });
        const kid = decodedJwt?.header?.kid;

        if (!kid) {
          return done(new Error('Unable to find key ID'), undefined); // Pass undefined instead of null
        }

        // Get the signing key from the JWKS endpoint using the kid
        client.getSigningKey(kid, (err, key) => {
          if (err) {
            return done(err, undefined); // Pass undefined instead of null
          }

          if (!key) {
            return done(new Error('Unable to find the signing key'), undefined); // Handle case where key is undefined
          }

          const signingKey = key.getPublicKey();
          done(null, signingKey); // Done with the signing key
        });
      },
    });
  }

  async validate(payload: any) {
    
    return { userId: payload.sub, username: payload.username };
  }
}

