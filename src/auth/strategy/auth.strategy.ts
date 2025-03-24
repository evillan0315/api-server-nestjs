import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { Strategy as GoogleOAuthStrategy, VerifyCallback, Profile } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class GithubStrategy extends PassportStrategy(GitHubStrategy, 'github') {
  constructor(private readonly configService: ConfigService) {
    super({
      clientID: configService.get<string>('GITHUB_CLIENT_ID'),
      clientSecret: configService.get<string>('GITHUB_CLIENT_SECRET'),
      callbackURL: `${configService.get<string>('API_URL')}/auth/github/callback`,
      scope: ['user:email'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any) {
    return { accessToken, profile };
  }
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(GoogleOAuthStrategy, 'google') {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: `${configService.get<string>('API_URL')}/auth/google/callback`,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ) {
    const user = {
      googleId: profile.id,
      name: profile.displayName,
      email: profile.emails?.[0]?.value || null,
      photoUrl: profile.photos?.[0]?.value || null,
    };
    done(null, user); // Pass user to the callback
  }
}

