import { Injectable, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  InitiateAuthCommand,
  GlobalSignOutCommand,
  AdminUserGlobalSignOutCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { DynamoDBClient, PutItemCommand, GetItemCommand } from "@aws-sdk/client-dynamodb";
import axios from 'axios';
import * as dotenv from 'dotenv';
import { AuthSignUpDto, AuthSignInDto, RefreshTokenDto } from './dto/auth.dto';
import { User } from '@prisma/client'; // If using Prisma, or adjust if you're using another ORM
import { Response } from 'express'; // Import Response from express
import * as jwt from 'jsonwebtoken';
import * as jwksClient from 'jwks-rsa';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

@ApiTags('Auth')
@Injectable()
export class AuthService {
  private dynamoDb: DynamoDBClient;

  constructor(private jwtService: JwtService) {
    this.dynamoDb = new DynamoDBClient({ region: process.env.AWS_REGION });
  }
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
  
  private readonly googleUserInfoUrl = `https://www.googleapis.com/oauth2/v3/userinfo`;
  private readonly githubUserInfoUrl = `https://api.github.com/user`;
  
  async generateApiKey(userId: string): Promise<string> {
    const apiKey = uuidv4();

    const params = {
      TableName: process.env.DYNAMODB_API_KEYS,
      Item: {
        userId: { S: userId },
        apiKey: { S: apiKey },
        createdAt: { S: new Date().toISOString() },
      },
    };

    await this.dynamoDb.send(new PutItemCommand(params));

    return apiKey;
  }
  async validateApiKey(apiKey: string): Promise<boolean> {
    const params = {
      TableName: process.env.DYNAMODB_API_KEYS,
      Key: { apiKey: { S: apiKey } },
    };

    const response = await this.dynamoDb.send(new GetItemCommand(params));

    if (!response.Item) {
      throw new UnauthorizedException('Invalid API key');
    }

    return true;
  }
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
  @ApiOperation({ summary: 'Github Login' })
  @ApiResponse({ status: 200, description: 'Github login successful' })
  async githubLogin(code: string) {
    
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
      throw new Error(error.response?.data || 'Github login failed');
    }
  }
  @ApiOperation({ summary: 'Github Getting user info' })
  @ApiResponse({ status: 200, description: 'Github user info' })
  async getGithubUserInfo(accessToken: string) {
    try {
      const response = await axios.get('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (!response.data) {
        throw new UnauthorizedException('Failed to fetch GitHub user info');
      }

      return {
        id: response.data.id,
        username: response.data.login,
        email: response.data.email,
        avatar_url: response.data.avatar_url,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired GitHub authentication token');
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
  @ApiOperation({ summary: 'Validate Google login' })
  @ApiResponse({ status: 200, description: 'Google login validated successfully' })
  async validateGoogleLogin(profile: any): Promise<User> {
    const { id, emails, displayName, photos } = profile;
    return profile;
    //console.log(profile, 'profile');
    // Check if user already exists based on the Google ID
    /*let user = await this.userService.findByGoogleId(id);

    if (!user) {
      // If user doesn't exist, create a new user
      user = await this.userService.createUser({
        googleId: id,
        email: emails[0].value,
        name: displayName,
        photoUrl: photos ? photos[0].value : null, // Store the profile photo URL if available
      });
    } 

    // Return the user object or user data as per your app's needs
    return user;*/
  }
  @ApiOperation({ summary: 'Get Google User Info' })
  @ApiResponse({ status: 200, description: 'Google User info retrieved successfully' })
  async getGoogleUserInfo(accessToken: string) {
    try {
      const response = await axios.get(this.googleUserInfoUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!response.data) {
        throw new UnauthorizedException('No user data returned from Google');
      }

      return {
        id: response.data.sub,
        email: response.data.email,
        name: response.data.name,
        picture: response.data.picture,
        locale: response.data.locale,
      };
    } catch (error: any) {
      if (error.response) {
        // Handle specific HTTP error codes from Google's API
        const status = error.response.status;
        if (status === 401) {
          throw new UnauthorizedException('Invalid or expired Google authentication token');
        } else if (status === 403) {
          throw new UnauthorizedException('Forbidden: Access denied to Google API');
        }
      }
      throw new InternalServerErrorException('Failed to fetch user info from Google');
    }
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



