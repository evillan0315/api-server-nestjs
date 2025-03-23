import { Injectable } from '@nestjs/common';
import { DynamoDBClient, PutItemCommand, ScanCommand } from '@aws-sdk/client-dynamodb';
import * as dotenv from 'dotenv';

dotenv.config();

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

  async getStoredCommands() {
    const scanParams = { TableName: this.tableName };
    const scanCommand = new ScanCommand(scanParams);
    return await this.dynamodbClient.send(scanCommand);
  }
}

