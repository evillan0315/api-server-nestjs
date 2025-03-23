import { Controller, Post, Param, Body, Req, Res, Get, Request, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AuthSignUpDto, AuthSignInDto, RefreshTokenDto } from './dto/auth.dto';
import { GoogleUserInfoDto } from './dto/google-userinfo.dto';
import { GoogleAuthGuard } from '../auth/jwt-auth.guard/jwt-auth.guard.guard';

// Import Request type from express
import { Request as ExpressRequest, Response} from 'express';
interface GoogleUser {
  id: string;
  email: string;
  name: string;
  // add any other properties that are available in the user object
}
@ApiTags('Auth')
@ApiBearerAuth()  // Swagger UI will expect the Authorization token in the header
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('google/login')
  @ApiOperation({ summary: 'Google Login' })  // Operation description for Swagger
  @ApiResponse({ 
    status: 200, 
    description: 'Google login successful', 
    schema: {
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            name: { type: 'string' },
            // Add other properties based on the userInfo object
          },
        },
      },
    },
  })  // Response schema for successful login
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid Google login credentials' 
  })  // Response for error case
  @ApiBody({ type: GoogleUserInfoDto })
  @UseGuards(GoogleAuthGuard)  // Guard for Google OAuth validation
  async googleLogin(@Body() userInfo: any) {
    return this.authService.googleLogin(userInfo);
  }
  
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)  // Guard for Google OAuth
  @ApiOperation({ summary: 'Google OAuth callback' })  // Operation description
  @ApiResponse({ 
    status: 200, 
    description: 'Successfully logged in with Google', 
    schema: {
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            name: { type: 'string' },
            // Add other properties based on the user object
          },
        },
      },
    },
  })  // Define the response format
  @ApiResponse({
    status: 400,
    description: 'Invalid Google login callback',
  })
  async googleLoginCallback(@Request() req: ExpressRequest) {
    if (!req.user) {
      throw new Error('No user found in request');
    }
    
    const user = req.user as GoogleUser; // Type the user object
    const validatedUser = await this.authService.validateGoogleLogin(user);
    return { user: validatedUser };  // Return the validated user or a token
  }
  @Post('google/userinfo')
  @ApiOperation({ summary: 'Get Google User Info' })
  @ApiResponse({
    status: 200,
    description: 'User info fetched successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        email: { type: 'string' },
        name: { type: 'string' },
        picture: { type: 'string' },
      },
    },
  }) // Response schema for successful user info retrieval
  @ApiResponse({ status: 400, description: 'Invalid or expired Google authentication token' })
  @ApiBody({ type: GoogleUserInfoDto })
  @UseGuards(GoogleAuthGuard)  // Guard for Google OAuth validation
  async getUserInfo(@Body() userInfo: any) {
    return this.authService.getUserInfo(userInfo);
  }

  @Post('signup')
  @ApiOperation({ summary: 'Sign-up' })
  @ApiResponse({ status: 200, description: 'User signed up successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiBody({ type: AuthSignUpDto })  // Use the DTO for the request body
  async signUp(@Body() signUpDto: AuthSignUpDto) {
    return this.authService.signUpUser(signUpDto.email, signUpDto.password, signUpDto.name);
  }
  @Post('signin')
  @ApiOperation({ summary: 'Sign-in' })
  @ApiResponse({ status: 200, description: 'User signed in successfully' })
  @ApiResponse({ status: 400, description: 'Invalid credentials' })
  @ApiBody({ type: AuthSignInDto })  // Use the DTO for the request body
  async signIn(
  @Body() signInDto: AuthSignInDto,
  @Res({ passthrough: true }) response: Response,  // Include Express response
) {
 
    const resp = await this.authService.signInUser(signInDto.email, signInDto.password);
    
          // Set HTTP-only cookie
  response.cookie('access_token', resp?.AccessToken, {
    httpOnly: true,
    secure: false,  // Set to true if using HTTPS
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  });
  return resp;
    //return this.authService.signInUser(signInDto.email, signInDto.password);
  }

  @Post('refresh-token')
  @ApiOperation({ summary: 'Refresh Token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout the user from the system' })
  @ApiResponse({
    status: 200,
    description: 'Successfully logged out',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'User logged out successfully',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Missing access token',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Access token is required',
        },
      },
    },
  })
  async logout(@Req() request: ExpressRequest, @Res() response: Response) {
    let accessToken = request.cookies['access_token']; // Try getting token from cookies

    if (!accessToken) {
      // Try extracting from Authorization header as a fallback
      accessToken = request.headers['authorization']?.split(' ')[1];
    }

    if (!accessToken) {
      return response.status(400).json({ message: 'Access token is required' });
    }

    try {
      await this.authService.logoutUser(accessToken, response);

      // Clear cookie
      response.clearCookie('access_token', {
        httpOnly: true,
        sameSite: 'strict',
        secure: true, // Ensure secure cookies in production
      });

      return response.json({ message: 'User logged out successfully' });
    } catch (error) {
      console.error('Logout error:', error);
      return response.status(401).json({ message: 'Invalid or expired access token' });
    }
  }

  @Post('admin/logout/:username')
  @ApiOperation({ summary: 'Admin Force Logout' })
  @ApiResponse({ status: 200, description: 'Admin forced logout successfully' })
  async adminLogout(@Param('username') username: string) {
    return this.authService.adminLogoutUser(username);
  }
}

