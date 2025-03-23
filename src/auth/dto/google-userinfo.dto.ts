// src/auth/dto/google-userinfo.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class GoogleUserInfoDto {
  @ApiProperty({ description: 'Google User ID', example: '1234567890' })
  googleId: string;

  @ApiProperty({ description: 'Google access token', example: 'ya29.a0AfH6SMDjshjd89qkjsdf...' })
  accessToken: string;
}

