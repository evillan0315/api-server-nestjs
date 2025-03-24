Here's a **detailed documentation** for implementing multi-provider authentication in your NestJS application with Amazon Cognito as the **default** provider. 🎯  

I'll cover:  
1. **Introduction**  
2. **Prerequisites**  
3. **Installation & Setup**  
4. **Multi-Provider JWT Authentication**  
5. **Implementation in NestJS**  
6. **Usage & Testing**  
7. **Best Practices**  

---

# **📌 Multi-Provider Authentication in NestJS (Cognito Default)**
> **Supports:** Amazon Cognito (default), Auth0, Google, Azure AD  
> **Authentication Methods:** Bearer Tokens & Cookies  
> **Security:** Validates JWTs dynamically using issuer-specific JWKS endpoints  

---

## **1️⃣ Introduction**
In this guide, we will set up **JWT authentication** in a **NestJS application** that supports multiple authentication providers.  
We will use **Amazon Cognito as the default provider**, but also allow authentication from:
- **Auth0**
- **Google OAuth**
- **Azure Active Directory (AD)**

This setup ensures that tokens issued by different authentication providers can be validated dynamically while maintaining Cognito as the **fallback default**.

---

## **2️⃣ Prerequisites**
### ✅ **AWS Cognito Setup**
- Create a **Cognito User Pool** in AWS  
- Copy the **User Pool ID** & **Region**  

### ✅ **Other Providers (Optional)**
- Set up authentication in **Auth0, Google, or Azure AD**  
- Retrieve the **JWKS (JSON Web Key Set) URL** for each provider  

### ✅ **NestJS Project**
Ensure you have a NestJS project with `passport-jwt` installed:
```sh
npm install @nestjs/passport passport passport-jwt jwks-rsa jsonwebtoken dotenv
```

---

## **3️⃣ Installation & Setup**
### **Install Required Packages**
```sh
npm install jwks-rsa jsonwebtoken
```

### **Environment Variables (.env)**
Add the necessary credentials in `.env`:
```ini
AWS_REGION=us-east-1
COGNITO_USER_POOL_ID=us-east-1_xxxxxxx
AUTH0_DOMAIN=your-auth0-domain.auth0.com
AZURE_TENANT_ID=your-azure-tenant-id
```

---

## **4️⃣ Multi-Provider JWT Authentication**
### **How it Works**
1. The JWT is **decoded** to extract the `kid` (key ID) and `iss` (issuer).
2. The correct **JWKS endpoint** is selected based on the issuer:
   - **Cognito (default)** → `https://cognito-idp.<AWS_REGION>.amazonaws.com/<USER_POOL_ID>/jwks.json`
   - **Auth0** → `https://<AUTH0_DOMAIN>/.well-known/jwks.json`
   - **Google** → `https://www.googleapis.com/oauth2/v3/certs`
   - **Azure AD** → `https://login.microsoftonline.com/<AZURE_TENANT_ID>/discovery/v2.0/keys`
3. The key is **retrieved dynamically** and used to validate the JWT.
4. If the issuer is **unknown**, it **defaults to Cognito**.

---

## **5️⃣ Implementation in NestJS**
### **✅ Create the `JwtStrategy` Class**
📄 `src/auth/jwt.strategy.ts`
```ts
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
    // JWKS Clients for multiple providers
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
        // Extract from Authorization header (Bearer token)
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
          return authHeader.split(' ')[1];
        }

        // Extract from cookies (if available)
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

          // Determine provider, defaulting to Cognito
          let client = jwksClients.cognito;
          if (issuer?.includes('auth0.com')) client = jwksClients.auth0;
          else if (issuer?.includes('google.com')) client = jwksClients.google;
          else if (issuer?.includes('microsoftonline.com')) client = jwksClients.azure;

          // Fetch the signing key
          client.getSigningKey(kid, (err, key) => {
            if (err || !key) return done(new Error('Unable to find signing key'), undefined);
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
```

---

## **6️⃣ Usage & Testing**
### **✅ Add Strategy to `AuthModule`**
📄 `src/auth/auth.module.ts`
```ts
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [PassportModule],
  providers: [JwtStrategy],
  exports: [PassportModule],
})
export class AuthModule {}
```

### **✅ Protect API Routes**
📄 `src/app.controller.ts`
```ts
import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Controller()
export class AppController {
  @UseGuards(AuthGuard('jwt'))
  @Get('protected')
  getProtected(@Request() req) {
    return { message: 'You have access!', user: req.user };
  }
}
```

### **✅ Start NestJS**
```sh
npm run start
```

### **✅ Test API with Bearer Token**
```http
GET /protected
Authorization: Bearer eyJhbGciOiJIUzI1...
```

### **✅ Test API with Cookies**
```http
GET /protected
Cookie: access_token=eyJhbGciOiJIUzI1...
```

---
### Example curl request

```sh
curl -X GET "http://localhost:5000/api/users/me" \
     -H "Authorization: Bearer TOKEN" \
     -H "Content-Type: application/json"

```
## **7️⃣ Best Practices**
✅ **Use environment variables** for security-sensitive data  
✅ **Implement role-based access control (RBAC)** to restrict endpoints  
✅ **Enable HTTPS** to encrypt token transmission  
✅ **Rotate keys** periodically to enhance security  

---

## **🎯 Final Thoughts**
You now have a **robust, multi-provider authentication** system in NestJS with **Amazon Cognito as the default**. This ensures **flexibility** while keeping **security a top priority**. 🛡️  

✨ Need more features like **refresh tokens** or **role-based authentication**? Just holler, sugar! 😊🚀
