import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('WebSocket')
@Controller('websocket')
export class WebsocketController {
  @Get('status')
  @ApiOperation({ summary: 'Get WebSocket server status' })
  getStatus() {
    return { status: 'WebSocket server running' };
  }
}

