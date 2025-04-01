import { Controller, Post, Body, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { LogService } from './log.service';
import { LogDto } from './dto/log.dto';
import * as fs from 'fs';

@ApiTags('Logging')
@Controller('log')
export class LogController {
  constructor(private readonly logService: LogService) {}

  @Post()
  @ApiOperation({ summary: 'Log a message with a specified level' })
  @ApiBody({ type: LogDto })
  logMessage(@Body() logDto: LogDto) {
    const { message, level } = logDto;

    if (level === 'info') this.logService.log(message);
    else if (level === 'warn') this.logService.warn(message);
    else if (level === 'error') this.logService.error(message);

    return { status: 'Logged', level };
  }
  @Get('history')
  @ApiOperation({ summary: 'Retrieve recent log entries' })
  getLogs() {
    const logFile = 'logs/combined.log';

    if (fs.existsSync(logFile)) {
      return fs.readFileSync(logFile, 'utf-8');
    } else {
      return { message: 'No logs available' };
    }
  }
}

