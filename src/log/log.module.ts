import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { LogService } from './log.service';
import { LogMiddleware } from './log.middleware';
import { LogController } from './log.controller';
import { WinstonModule, WINSTON_MODULE_PROVIDER } from 'nest-winston';
import * as winston from 'winston';

@Module({
  imports: [
    WinstonModule.forRoot({
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          ),
        }),
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
      ],
    }),
  ],
  controllers: [LogController],
  providers: [LogService],
  exports: [LogService],
})
export class LogModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LogMiddleware).forRoutes('*');
  }
}
