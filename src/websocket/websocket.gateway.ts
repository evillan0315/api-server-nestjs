import { Logger } from '@nestjs/common';
import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('WebSocket')
@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000', 'https://board-dynamodb.duckdns.org'],
    credentials: true,
  },
})
export class WebsocketGateway {
  private readonly logger = new Logger(WebsocketGateway.name);

  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('message')
  handleMessage(@MessageBody() data: string): string {
    this.logger.log(`Message received: ${data}`);
    return `Message received: ${data}`;
  }
}

