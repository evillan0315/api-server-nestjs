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
import { PrismaModule } from '../prisma/prisma.module';  // ✅ Add PrismaModule
import { ApiKeyAuthGuard } from '../auth/guard/api-key.guard';

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
    forwardRef(() => UsersModule),
    PrismaModule,  // ✅ Add this to fix missing dependency
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    GoogleStrategy,
    GithubStrategy,
    CognitoAuthGuard,
    GoogleAuthGuard,
    JwtAuthGuard,
    GithubAuthGuard,
    ApiKeyAuthGuard,
  ],
  exports: [
    AuthService,
    JwtModule,
  ],
})
export class AuthModule {}

