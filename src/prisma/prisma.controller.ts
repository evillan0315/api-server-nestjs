import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBody, ApiResponse, ApiBearerAuth  } from '@nestjs/swagger';
import { PrismaService } from './prisma.service';
import { PrismaOperationDto } from './dto/prisma-operation.dto';


import { CognitoAuthGuard } from '../auth/jwt-auth.guard/jwt-auth.guard.guard';

@ApiTags('Prisma')
@ApiBearerAuth() // Enables JWT authentication in Swagger
@Controller('api/prisma')
@UseGuards(CognitoAuthGuard) // Protect all routes

export class PrismaController {
  constructor(private readonly prismaService: PrismaService) {}

  @Post()
  @ApiOperation({ summary: 'Execute a dynamic Prisma operation' })
  @ApiResponse({ status: 200, description: 'Operation executed successfully.' })
  async executeOperation(@Body() body: PrismaOperationDto) {
    return this.prismaService.handler(body.model, body.operation, body.data);
  }
}

