import { Controller, Get, Post, Body, UseGuards, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBody, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DynamoDBService } from './dynamodb.service';
import { CognitoAuthGuard } from '../auth/guard/auth.guard';

@ApiTags('DynamoDB')
@ApiBearerAuth() // Enables JWT authentication in Swagger
@Controller('api/dynamodb')
@UseGuards(CognitoAuthGuard) // Protect all routes
export class DynamoDBController {
  constructor(private readonly dynamoDBService: DynamoDBService) {}

  @Post('store-command')
  @ApiOperation({ summary: 'Store a command in DynamoDB' })
  @ApiBody({ schema: { type: 'object', properties: { command: { type: 'string' } } } })
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

  @Post('create-table')
  @ApiOperation({ summary: 'Create a new DynamoDB table' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        tableName: { type: 'string' },
        keySchema: { type: 'array', items: { type: 'object' } },
        attributeDefinitions: { type: 'array', items: { type: 'object' } },
        provisionedThroughput: { type: 'object', properties: { ReadCapacityUnits: { type: 'number' }, WriteCapacityUnits: { type: 'number' } } },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Table created successfully' })
  async createTable(
    @Body('tableName') tableName: string,
    @Body('keySchema') keySchema: any,
    @Body('attributeDefinitions') attributeDefinitions: any,
    @Body('provisionedThroughput') provisionedThroughput: any
  ) {
    await this.dynamoDBService.createTable(tableName, keySchema, attributeDefinitions, provisionedThroughput);
    return { message: `Table ${tableName} created successfully` };
  }
  @Get('list-tables')
  @ApiOperation({ summary: 'List all DynamoDB tables' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved table names' })
  async listTables() {
    return await this.dynamoDBService.listTables();
  }
  @Get('list-data/:tableName')
  @ApiOperation({ summary: 'List all stored data for a specific table' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved data' })
  async listTableData(@Param('tableName') tableName: string) {
    return await this.dynamoDBService.listTableData(tableName);
  }
}


