import { Injectable, NestMiddleware, Inject } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger as WinstonLogger } from 'winston';

@Injectable()
export class LogMiddleware implements NestMiddleware {
  constructor(@Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger) {}

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl } = req;
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      this.logger.info(`${method} ${originalUrl} ${res.statusCode} - ${duration}ms`);
    });

    next();
  }
}
