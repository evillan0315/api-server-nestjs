import { ApiProperty } from '@nestjs/swagger';

export class LogDto {
  @ApiProperty({ example: 'This is a log message' })
  message: string;

  @ApiProperty({ example: 'info', enum: ['info', 'warn', 'error'] })
  level: 'info' | 'warn' | 'error';
}

