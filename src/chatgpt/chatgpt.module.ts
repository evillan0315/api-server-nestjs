// src/chatgpt/chatgpt.module.ts
import { Module } from '@nestjs/common';
import { ChatgptService } from './chatgpt.service';
import { ChatgptController } from './chatgpt.controller';

@Module({
  imports: [],
  controllers: [ChatgptController],
  providers: [ChatgptService],
})
export class ChatgptModule {}

