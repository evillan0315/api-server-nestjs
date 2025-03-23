import { Controller, Get, Render } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Render('landing') // Render the "landing.hbs" file
  getLanding() {
    return { message: 'Welcome to the NestJS API Server!' }; // Data to pass to the template
  }
}
