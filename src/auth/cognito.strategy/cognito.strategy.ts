import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import * as dotenv from 'dotenv';
import * as jwksClient from 'jwks-rsa';
import * as jwt from 'jsonwebtoken';

dotenv.config();

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    // Define JWKS clients for multiple providers
    const jwksClients = {
      cognito: jwksClient({
        jwksUri: `https://cognito-idp.${process.env.AWS_REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}/.well-known/jwks.json`,
      }),
      auth0: jwksClient({
        jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
      }),
      google: jwksClient({
        jwksUri: `https://www.googleapis.com/oauth2/v3/certs`,
      }),
      azure: jwksClient({
        jwksUri: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/discovery/v2.0/keys`,
      }),
    };

    super({
      jwtFromRequest: (req) => {
        // Check Authorization header for Bearer token
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
          return authHeader.split(' ')[1];
        }

        // If no Bearer token, check cookies
        if (req && req.cookies) {
          return req.cookies['access_token'];
        }

        return null;
      },
      secretOrKeyProvider: (request, rawJwtToken, done) => {
        try {
          const decodedJwt = jwt.decode(rawJwtToken, { complete: true }) as jwt.Jwt | null;

	if (!decodedJwt || !decodedJwt.header || !decodedJwt.payload) {
	  return done(new Error('Invalid JWT token'), undefined);
	}

	const kid = decodedJwt.header.kid;
	const issuer = (decodedJwt.payload as jwt.JwtPayload)?.iss; // Extract issuer safely



          if (!kid) {
            return done(new Error('Missing key ID'), undefined);
          }

          // Determine the JWKS client based on issuer, defaulting to Cognito
          let client = jwksClients.cognito; // Default to Cognito
          if (issuer?.includes('auth0.com')) {
            client = jwksClients.auth0;
          } else if (issuer?.includes('google.com')) {
            client = jwksClients.google;
          } else if (issuer?.includes('microsoftonline.com')) {
            client = jwksClients.azure;
          }

          // Fetch the signing key
          client.getSigningKey(kid, (err, key) => {
            if (err || !key) {
              return done(new Error('Unable to find signing key'), undefined);
            }
            done(null, key.getPublicKey());
          });
        } catch (err) {
          return done(err, undefined);
        }
      },
    });
  }

  async validate(payload: any) {
    return { userId: payload.sub, username: payload.username, provider: payload.iss || 'Amazon Cognito' };
  }
}

