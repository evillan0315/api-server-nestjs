import { Controller, Post, Get, Delete, Body, Query, UseGuards , Request } from '@nestjs/common';
import { GoogleGeminiService } from './google-gemini.service';
import { ApiTags, ApiOperation, ApiQuery, ApiBody, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CognitoAuthGuard } from '../auth/jwt-auth.guard/jwt-auth.guard.guard';
import { v4 as uuidv4 } from 'uuid'; 

import { GeminiDto } from './dto/gemini.dto';

@ApiTags('Google Gemini')
@Controller('google-gemini')
@ApiBearerAuth() // Enables JWT authentication in Swagger
@UseGuards(CognitoAuthGuard) // Protect all routes
export class GoogleGeminiController {
  constructor(
    private readonly googleGeminiService: GoogleGeminiService,
  ) {}
  
  @Post('process-input')
  @ApiOperation({ summary: 'Process user input using Google Gemini API' })
  @ApiResponse({
    status: 200,
    description: 'Successfully processed content',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request',
  })
  @ApiBody({
    description: 'User input for processing',
    type: GeminiDto,
  })
  
  async processInput(@Request() req, @Body() geminiDto: GeminiDto) {
    const { contents } = geminiDto;
    const question = contents[0]?.parts[0]?.text;
    const userEmail = req.user.username || "guest";  // Get the current logged-in user's email from the request
    const chatId = uuidv4(); // You should pass this dynamically (e.g., from session or database)
    // Save the response from Gemini as a message from the AI
      
    return await this.googleGeminiService.processInputAndSaveToDb(userEmail, question, chatId);
  }
  @Post('generate-content')
  @ApiOperation({ summary: 'Generate content using Google Gemini API' })
  @ApiResponse({
    status: 200,
    description: 'Successfully generated content from the Google Gemini model',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request',
  })
  @ApiBody({
    description: 'The input data for generating content from the Google Gemini API',
    type: GeminiDto,
  })
  async generateContent(@Body() geminiDto: GeminiDto) {
    return await this.googleGeminiService.generateContent(geminiDto);
  }
}

