// src/chatgpt/chatgpt.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { ChatgptService } from './chatgpt.service';

@Controller('api/chatgpt')
export class ChatgptController {
  constructor(private readonly chatgptService: ChatgptService) {}

  @Post('ask')
  async ask(@Body() body: { question: string }) {
    const response = await this.chatgptService.getChatGptResponse(body.question);
    return { answer: response };
  }
}

