import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import * as dotenv from 'dotenv';
import * as jwksClient from 'jwks-rsa';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../../prisma/prisma.service';

dotenv.config();

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) { // Inject PrismaService
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
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
          return authHeader.split(' ')[1];
        }
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
          const issuer = (decodedJwt.payload as jwt.JwtPayload)?.iss;

          if (!kid) {
            return done(new Error('Missing key ID'), undefined);
          }

          let client = jwksClients.cognito;
          if (issuer?.includes('auth0.com')) client = jwksClients.auth0;
          else if (issuer?.includes('google.com')) client = jwksClients.google;
          else if (issuer?.includes('microsoftonline.com')) client = jwksClients.azure;

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
    console.log('Decoded JWT Payload:', payload);

    if (!payload || !payload.sub) {
      throw new UnauthorizedException('Invalid JWT payload');
    }

    // 🛠 Fetch user from Prisma by their Cognito/Auth0/Google ID
    const user = await this.prisma.user.findFirst({
	  where: {
	    OR: [
	      { cognitoId: payload.sub },        // Search by Auth ID (Cognito/Auth0)
	      { email: payload.email },        // Search by Email
	      { username: payload.username }   // Search by Username
	    ]
	  }
	});

    if (!user) {
      throw new UnauthorizedException('User not found in database');
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      //role: user.role,
      provider: payload.iss || 'Amazon Cognito',
    };
  }
}

