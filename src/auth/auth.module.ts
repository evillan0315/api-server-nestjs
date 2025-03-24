import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './cognito.strategy/cognito.strategy';
import { GoogleStrategy } from './strategy/google.strategy';
import { GithubStrategy } from './strategy/github.strategy';
import { GoogleAuthGuard, CognitoAuthGuard, GithubAuthGuard, JwtAuthGuard } from './guard/auth.guard';
import { UsersModule } from '../users/users.module';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Auth')
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'defaultSecret',
      signOptions: { expiresIn: '1h' },
    }),
    forwardRef(() => UsersModule), // ✅ Fix circular dependency
  ],
  providers: [
    AuthService,
    JwtStrategy,
    GoogleStrategy,
    GithubStrategy,
    CognitoAuthGuard,
    GoogleAuthGuard,
    JwtAuthGuard,
    GithubAuthGuard,
  ],
  controllers: [AuthController],
  exports: [
    CognitoAuthGuard,
    GoogleAuthGuard,
    GithubAuthGuard,
    JwtAuthGuard,
    AuthService,
    JwtModule,
  ],
})
export class AuthModule {}

