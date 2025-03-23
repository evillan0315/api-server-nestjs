import { Module } from '@nestjs/common';
import { WebsocketController } from './websocket.controller';
import { WebsocketService } from './websocket.service';
import { AuthModule } from '../auth/auth.module'; // 👈 Import AuthModule
import { WebsocketGateway } from './websocket.gateway';
import { DynamoDBService } from '../dynamodb/dynamodb.service';

import { ApiTags} from '@nestjs/swagger';

@ApiTags('WebSocket')
@Module({
  imports: [AuthModule], // 👈 Ensure AuthModule is imported
  controllers: [WebsocketController],
  providers: [WebsocketService, WebsocketGateway, DynamoDBService]
})
export class WebsocketModule {}
