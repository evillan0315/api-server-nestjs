import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './cognito.strategy/cognito.strategy';
import { GoogleStrategy } from './strategy/google.strategy';
import { GithubStrategy } from './strategy/github.strategy';
import { GoogleAuthGuard, CognitoAuthGuard, GithubAuthGuard, JwtAuthGuard } from './guard/auth.guard';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Auth') // Adds Swagger tag for authentication module
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Ensures ConfigService is available throughout the app
      envFilePath: '.env', // Explicitly load .env file
    }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'defaultSecret', // Load secret from env
      signOptions: { expiresIn: '1h' }, // Token expiry
    }),
  ],
  providers: [
    AuthService, 
    JwtStrategy, 
    GoogleStrategy, 
    GithubStrategy, 
    CognitoAuthGuard, 
    GoogleAuthGuard, 
    JwtAuthGuard, 
    GithubAuthGuard
  ],
  controllers: [AuthController],
  exports: [
    CognitoAuthGuard, 
    GoogleAuthGuard, 
    GithubAuthGuard, 
    JwtAuthGuard, 
    AuthService, 
    JwtModule // Export JwtModule for use in other modules
  ],
})

export class AuthModule {}

