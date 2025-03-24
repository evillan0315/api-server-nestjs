import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBody, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DynamoDBService } from './dynamodb.service';
import { CognitoAuthGuard } from '../auth/jwt-auth.guard/jwt-auth.guard.guard';

@ApiTags('DynamoDB')
@ApiBearerAuth() // Enables JWT authentication in Swagger
@Controller('api/dynamodb')
@UseGuards(CognitoAuthGuard) // Protect all routes
export class DynamoDBController {
  constructor(private readonly dynamoDBService: DynamoDBService) {}

  @Post('store-command')
  @ApiOperation({ summary: 'Store a command in DynamoDB' })
  @ApiResponse({ status: 201, description: 'Command stored successfully' })
  async storeCommand(@Body('command') command: string) {
    await this.dynamoDBService.storeCommand(command);
    return { message: 'Command stored successfully' };
  }

  @Get('stored-commands')
  @ApiOperation({ summary: 'Retrieve stored commands from DynamoDB' })
  @ApiResponse({ status: 200, description: 'Stored commands retrieved successfully' })
  async getStoredCommands() {
    return await this.dynamoDBService.getStoredCommands();
  }
}

