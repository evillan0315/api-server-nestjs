import { Injectable } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DynamoDBClient, PutItemCommand, ScanCommand, CreateTableCommand, ListTablesCommand } from '@aws-sdk/client-dynamodb';
import * as dotenv from 'dotenv';

dotenv.config();

@ApiTags('DynamoDB')
@Injectable()
export class DynamoDBService {
  private dynamodbClient: DynamoDBClient;
  private tableName: string;

  constructor() {
    this.dynamodbClient = new DynamoDBClient({
      region: process.env.AWS_REGION!,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
    this.tableName = process.env.DYNAMODB_TABLE_NAME!;
  }

  @ApiOperation({ summary: 'Store a command in DynamoDB' })
  @ApiResponse({ status: 201, description: 'Command stored successfully' })
  async storeCommand(command: string): Promise<void> {
    const commandId = new Date().toISOString();
    const putParams = {
      TableName: this.tableName,
      Item: {
        commandId: { S: commandId },
        command: { S: command },
        timestamp: { S: new Date().toISOString() },
      },
    };

    const putCommand = new PutItemCommand(putParams);
    await this.dynamodbClient.send(putCommand);
  }

  @ApiOperation({ summary: 'Retrieve stored commands from DynamoDB' })
  @ApiResponse({ status: 200, description: 'Stored commands retrieved successfully' })
  async getStoredCommands() {
    const scanParams = { TableName: this.tableName };
    const scanCommand = new ScanCommand(scanParams);
    return await this.dynamodbClient.send(scanCommand);
  }

  @ApiOperation({ summary: 'Create a new DynamoDB table' })
  @ApiResponse({ status: 201, description: 'Table created successfully' })
  async createTable(tableName: string, keySchema: any, attributeDefinitions: any, provisionedThroughput: any): Promise<void> {
    const createTableParams = {
      TableName: tableName,
      KeySchema: keySchema,
      AttributeDefinitions: attributeDefinitions,
      ProvisionedThroughput: provisionedThroughput,
    };

    const createTableCommand = new CreateTableCommand(createTableParams);
    await this.dynamodbClient.send(createTableCommand);
  }
  @ApiOperation({ summary: 'List all DynamoDB tables' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved table names' })
  async listTables(): Promise<{ tableNames: string[] }> {
    const command = new ListTablesCommand({});
    const response = await this.dynamodbClient.send(command);
    return { tableNames: response.TableNames || [] };
  }
  @ApiOperation({ summary: 'List all stored data for a specific table' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved data' })
  async listTableData(tableName: string): Promise<{ items: any[] }> {
    const scanParams = { TableName: tableName };
    const scanCommand = new ScanCommand(scanParams);
    const response = await this.dynamodbClient.send(scanCommand);
    return { items: response.Items || [] };
  }
}

// Real-world example JSON body for creating a table
// {
//   "tableName": "string",
//   "keySchema": [
//     {}
//   ],
//   "attributeDefinitions": [
//     {}
//   ],
//   "provisionedThroughput": {
//     "ReadCapacityUnits": 0,
//     "WriteCapacityUnits": 0
//   }
// }

