import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service'; // 👈 Ensure correct path

@Injectable()
export class ApiKeyAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {} // ✅ Now this should work!

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];

    if (!apiKey) {
      throw new UnauthorizedException('API Key is missing');
    }

    const userInfo = await this.authService.validateApiKey(apiKey);

    if (!userInfo || !userInfo.user) {
      throw new UnauthorizedException('Invalid API Key');
    }

    request.user = userInfo.user; // ✅ Attach user info to request
    return true;
  }
}

