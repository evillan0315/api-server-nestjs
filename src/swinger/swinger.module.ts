// src/swinger/swinger.module.ts
import { Module } from '@nestjs/common';
import { SwingerController } from './swinger.controller';
import { SwingerService } from './swinger.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [],
  controllers: [SwingerController],
  providers: [SwingerService, PrismaService],
})
export class SwingerModule {}

