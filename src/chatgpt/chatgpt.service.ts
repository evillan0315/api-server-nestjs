// src/chatgpt/chatgpt.service.ts
import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();
// Disable proxy globally
axios.defaults.proxy = false;
const MAX_RETRIES = 5;
const RETRY_DELAY = 1000;  // Initial delay in ms

@Injectable()
export class ChatgptService {
  async getChatGptResponse(question: string, attempt: number = 1): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY; // Replace with your actual OpenAI API key
    const apiUrl = 'https://api.openai.com/v1/completions';

    try {
      const response = await axios.post(
        apiUrl,
        {
          model: 'gpt-3.5-turbo',  // You can replace this with another model if needed
          messages: [{ role: 'user', content: question }],
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          proxy: false, 
        },
      );

      return response.data.choices[0]?.message?.content || 'No response from ChatGPT';
    } catch (error: any) {
    if (error.response?.status === 429 && attempt <= MAX_RETRIES) {
      // Retry logic: exponential backoff
      const delay = RETRY_DELAY * Math.pow(2, attempt);
      console.log(`Rate limit hit. Retrying in ${delay}ms...`);
      
      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));
      
      return this.getChatGptResponse(question, attempt + 1);  // Retry
    }
    
    console.error('Error with ChatGPT API:', error);
    throw new Error('Failed to get a response from ChatGPT');
  }
  }
}

