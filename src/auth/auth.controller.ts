import { Controller, Post, Param, Body, Req, Res, Get, Request, UseGuards, UnauthorizedException, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth, ApiBody, ApiQuery, ApiCookieAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AuthSignUpDto, AuthSignInDto, RefreshTokenDto, ValidateTokenDto } from './dto/auth.dto';
import { GoogleUserInfoDto } from './dto/google-userinfo.dto';
import { GoogleAuthGuard, CognitoAuthGuard, GithubAuthGuard, JwtAuthGuard } from './guard/auth.guard';


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
  @Get('session')
  @ApiOperation({ summary: 'Get user session' })
  @ApiResponse({ status: 200, description: 'User session retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiCookieAuth('token') // Indicates that a cookie-based auth is required
  async getSession(@Req() req: ExpressRequest, @Res() res: Response) {
    //console.log(req.cookies, 'req.cookies?')
    const token = req.cookies?.access_token; // Extract token from cookies

    if (!token) {
      throw new UnauthorizedException('No session found');
    }

    const user = await this.authService.validateToken(token);

    if (!user) {
      throw new UnauthorizedException('Invalid session');
    }

    return res.json({ user });
  }

  @Get('cognito/login')
  @ApiOperation({ summary: 'Redirect to Cognito login' })
  @ApiResponse({ status: 302, description: 'Redirecting to Cognito login' })
  async cognitoLogin(@Res() res: Response) {
    const authUrl = await this.authService.cognitoLogin();
    return res.redirect(authUrl);
  }
  @UseGuards(JwtAuthGuard)
  @Post('generate/api/key')
  @ApiOperation({ summary: 'Generate API Key' })
  @ApiBearerAuth()
  @ApiResponse({
    status: 201,
    description: 'API key successfully generated',
    schema: {
      type: 'object',
      properties: {
        apiKey: { type: 'string', example: 'abc123xyz456' },
      },
    },
  })
  async generateApiKey(@Req() req) {
    const user = req.user;
    console.log(user, 'user');
    const apiKey = await this.authService.generateApiKey(user);
    return { apiKey };
  }

  @Get('validate/api/key')
@ApiOperation({ summary: 'Validate API Key' })
@ApiQuery({ name: 'apiKey', required: true, example: 'abc123xyz456' })
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiResponse({
  status: 200,
  description: 'API key validation result',
  schema: {
    type: 'object',
    properties: {
      valid: { type: 'boolean', example: true },
      user: {
        type: 'object',
        nullable: true,
        properties: {
          userId: { type: 'string', example: '1234-5678' },
          username: { type: 'string', example: 'edvillan15' },
          email: { type: 'string', example: 'user@example.com' },
        },
      },
    },
  },
})
async validateApiKey(@Query('apiKey') apiKey: string) {
  const result = await this.authService.validateApiKey(apiKey);
  return result;
}
  @Post('validate/token')
  @ApiOperation({ summary: 'Validate a JWT token' })
  @ApiResponse({ status: 200, description: 'Token is valid' })
  @ApiResponse({ status: 401, description: 'Invalid or expired token' })
  @ApiBody({ type: ValidateTokenDto }) // Specify the DTO for input validation
  async validateToken(@Body() validateTokenDto: ValidateTokenDto) {
    try {
      const { token } = validateTokenDto; // Get token from request body
      const payload = await this.authService.validateToken(token); // Call the validateToken method
      return { message: 'Token is valid', payload }; // Return payload if token is valid
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
  @Get('github/login')
  //@UseGuards(JwtAuthGuard('github'))
  @ApiOperation({ summary: 'GitHub Login' })
  @ApiResponse({
    status: 200,
    description: 'Redirects to GitHub for authentication',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Redirecting to GitHub authentication...' },
      },
    },
  })
  async githubLogin() {
    return { message: 'Redirecting to GitHub authentication...' };
  }

  @Get('github/callback')
  //@UseGuards(AuthGuard('github'))
  @ApiOperation({ summary: 'GitHub OAuth callback' })
  @ApiResponse({
    status: 200,
    description: 'Successfully authenticated with GitHub',
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string', example: 'gho_xxx' },
        profile: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '123456' },
            username: { type: 'string', example: 'octocat' },
            email: { type: 'string', example: 'octocat@github.com' },
            avatar_url: { type: 'string', example: 'https://github.com/images/error/octocat_happy.gif' },
          },
        },
      },
    },
  })
  @Post('github/userinfo')
  @ApiOperation({ summary: 'Get GitHub User Info' })
  @ApiResponse({
    status: 200,
    description: 'GitHub user info fetched successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: '123456' },
        username: { type: 'string', example: 'octocat' },
        email: { type: 'string', example: 'octocat@github.com' },
        avatar_url: { type: 'string', example: 'https://github.com/images/error/octocat_happy.gif' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired GitHub authentication token',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string', example: 'gho_xxx' },
      },
    },
  })
  async getGithubUserInfo(@Body() body: { accessToken: string }) {
    return this.authService.getGithubUserInfo(body.accessToken);
  }
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

