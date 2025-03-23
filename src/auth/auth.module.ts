import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './cognito.strategy/cognito.strategy';
import { GoogleStrategy } from './strategy/google.strategy';
import { GoogleAuthGuard, CognitoAuthGuard } from './jwt-auth.guard/jwt-auth.guard.guard';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Auth') // Adds Swagger tag for authentication module
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Ensures ConfigService is available throughout the app
      envFilePath: '.env', // Explicitly load .env file
    }),
  ],
  providers: [AuthService, JwtStrategy, GoogleStrategy, CognitoAuthGuard, GoogleAuthGuard],
  controllers: [AuthController],
  exports: [CognitoAuthGuard, GoogleAuthGuard, AuthService],
})

export class AuthModule {}

