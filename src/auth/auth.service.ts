import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  InitiateAuthCommand,
  GlobalSignOutCommand,
  AdminUserGlobalSignOutCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import axios from 'axios';
import * as dotenv from 'dotenv';
import { AuthSignUpDto, AuthSignInDto, RefreshTokenDto } from './dto/auth.dto';
import { User } from '@prisma/client'; // If using Prisma, or adjust if you're using another ORM
import { Response } from 'express'; // Import Response from express
import * as jwt from 'jsonwebtoken';
import * as jwksClient from 'jwks-rsa';

dotenv.config();

@ApiTags('Auth')
@Injectable()
export class AuthService {
  private cognitoClient = new CognitoIdentityProviderClient({
    region: process.env.AWS_REGION!,
  });

  private userPoolId = process.env.AWS_USER_POOL_ID!;
  private clientId = process.env.AWS_USER_POOL_WEB_CLIENT_ID!;
  private cognitoDomain = process.env.COGNITO_DOMAIN!;
  private redirectUri = process.env.COGNITO_REDIRECT_URI!;
  private googleClientSecret = process.env.GOOGLE_CLIENT_SECRET!;
  private clientSecret = process.env.COGNITO_CLIENT_SECRET!;
  
  private jwksUri = `https://cognito-idp.${process.env.AWS_REGION}.amazonaws.com/${process.env.AWS_USER_POOL_ID}/.well-known/jwks.json`;
  private jwks = jwksClient({ jwksUri: this.jwksUri });

  async validateToken(token: string): Promise<any> {
    if (!token) {
      throw new UnauthorizedException('Token is missing');
    }

    try {
      // Decode token to get the kid
      const decodedJwt = jwt.decode(token, { complete: true });
      if (!decodedJwt || !decodedJwt.header || !decodedJwt.header.kid) {
        throw new UnauthorizedException('Invalid token');
      }

      const key = await this.jwks.getSigningKey(decodedJwt.header.kid);
      const signingKey = key.getPublicKey();

      // Verify token using the correct signing key
      const payload = jwt.verify(token, signingKey, { algorithms: ['RS256'] });

      return payload; // Return decoded user information
    } catch (error) {
      console.error('Token validation failed:', error);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
  @ApiOperation({ summary: 'Google Login' })
  @ApiResponse({ status: 200, description: 'Google login successful' })
  async googleLogin(code: string) {
    try {
      const tokenResponse = await axios.post(
        `${this.cognitoDomain}/oauth2/token`,
        new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: this.clientId,
          client_secret: this.clientSecret,
          code: code,
          redirect_uri: this.redirectUri,
        }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );
      return tokenResponse.data;
    } catch (error: any) {
      throw new Error(error.response?.data || 'Google login failed');
    }
  }
  async validateGoogleLogin(profile: any): Promise<User> {
    const { id, emails, displayName, photos } = profile;
    console.log(profile, 'profile');
    // Check if user already exists based on the Google ID
    //let user = await this.userService.findByGoogleId(id);
    return profile;
   /* if (!user) {
      // If user doesn't exist, create a new user
      user = await this.userService.createUser({
        googleId: id,
        email: emails[0].value,
        name: displayName,
        photoUrl: photos ? photos[0].value : null, // Store the profile photo URL if available
      });
    } */

    // Return the user object or user data as per your app's needs
    //return user;
  }
  @ApiOperation({ summary: 'Get User Info' })
  @ApiResponse({ status: 200, description: 'User info retrieved successfully' })
  async getUserInfo(accessToken: string) {
    try {
      const response = await axios.get(`${this.cognitoDomain}/oauth2/userInfo`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data || 'Failed to fetch user info');
    }
  }

  @ApiOperation({ summary: 'User Sign-up' })
  @ApiResponse({ status: 201, description: 'User signed up successfully' })
  async signUpUser(email: string, password: string, name: string) {
    try {
      const command = new SignUpCommand({
        ClientId: this.clientId,
        Username: email,
        Password: password,
        UserAttributes: [
          { Name: 'email', Value: email },
          { Name: 'name', Value: name },
        ],
      });
      const response = await this.cognitoClient.send(command);
      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Sign-up failed');
    }
  }

  @ApiOperation({ summary: 'User Sign-in' })
  @ApiResponse({ status: 200, description: 'User signed in successfully' })
  async signInUser(email: string, password: string) {

    try {
      const command = new InitiateAuthCommand({
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: this.clientId,
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password,
        },
      });
      const response = await this.cognitoClient.send(command);

      return response.AuthenticationResult;
    } catch (error: any) {
      throw new Error(error.message || 'Sign-in failed');
    }
  }

  @ApiOperation({ summary: 'Refresh Token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  async refreshToken(refreshToken: string) {
    try {
      const command = new InitiateAuthCommand({
        AuthFlow: 'REFRESH_TOKEN_AUTH',
        ClientId: this.clientId,
        AuthParameters: {
          REFRESH_TOKEN: refreshToken,
        },
      });
      const response = await this.cognitoClient.send(command);
      return response.AuthenticationResult;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to refresh token');
    }
  }
@ApiTags('Auth') // Swagger tag for grouping
@ApiOperation({ summary: 'User Logout' })
@ApiResponse({ status: 200, description: 'User logged out successfully' })
@ApiResponse({ status: 400, description: 'Access token is required' })
@ApiResponse({ status: 500, description: 'Logout failed' })
async logoutUser(
  accessToken: string,
  response: Response, // Inject Express Response
): Promise<{ message: string }> {
    if (!accessToken) {
      throw new Error('Access token is required');
    }

    try {
      const command = new GlobalSignOutCommand({
        AccessToken: accessToken,
      });

      await this.cognitoClient.send(command);

      return { message: 'User logged out successfully' };
    } catch (error: any) {
      console.error('Error during logout:', error);
      throw new Error(error.message || 'Logout failed');
    }
  }

  @ApiOperation({ summary: 'Admin Logout (Force sign-out)' })
  @ApiResponse({ status: 200, description: 'User forcefully logged out by admin' })
  async adminLogoutUser(username: string) {
    try {
      const command = new AdminUserGlobalSignOutCommand({
        UserPoolId: this.userPoolId,
        Username: username,
      });
      await this.cognitoClient.send(command);
      return { message: 'User forcefully logged out by admin' };
    } catch (error: any) {
      throw new Error(error.message || 'Admin logout failed');
    }
  }
}



