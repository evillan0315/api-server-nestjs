import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service'; // Ensure correct import

@Injectable()
export class ApiKeyAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];

    console.log('🔑 Received API Key:', apiKey); // Debug log

    if (!apiKey) {
      console.error('❌ API Key Missing');
      throw new UnauthorizedException('API Key is missing');
    }

    const isValid = await this.authService.validateApiKey(apiKey);
    console.log('✅ API Key Valid:', isValid); // Debug log

    if (!isValid) {
      console.error('❌ Invalid API Key');
      throw new UnauthorizedException('Invalid API Key');
    }

    return true;
  }
}

