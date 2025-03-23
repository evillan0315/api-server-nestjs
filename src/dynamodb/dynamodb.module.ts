import { Module } from '@nestjs/common';
import { DynamoDBService } from './dynamodb.service';
import { DynamoDBController } from './dynamodb.controller';

@Module({
  providers: [DynamoDBService],
  controllers: [DynamoDBController],
  exports: [DynamoDBService],
})
export class DynamoDBModule {}

