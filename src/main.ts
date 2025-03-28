import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as dotenv from 'dotenv';
import * as cookieParser from 'cookie-parser';
import { NestExpressApplication } from '@nestjs/platform-express';  // Import NestExpressApplication
import * as path from 'path';  // Import path module

dotenv.config(); // Load environment variables

async function bootstrap() {
  //const app = await NestFactory.create(AppModule);
  // Create the app with NestExpressApplication
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:4173',
    'http://localhost:5000',
    'https://board-api.duckdns.org',
    'https://board-dynamodb.duckdns.org',
  ]
  https://cdn.jsdelivr.net/npm/tailwindcss@2.0.0/dist/tailwind.min.css
  app.use(cookieParser());
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.error(`Blocked by CORS: ${origin}`); // Debugging
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });
  
   // Set Handlebars as the view engine
  app.setViewEngine('hbs');

  // Set the base directory for views
  app.setBaseViewsDir(path.join(__dirname, '..', 'src', 'views'));
  // Swagger Configuration
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Server API')
    .setDescription('API Documentation')
    .setVersion('1.0')
    .addTag('Auth')
    .addBearerAuth() // Enable Authorization Header
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api-docs', app, document); // Swagger UI at /api/docs
  
  // Graceful shutdown setup
  app.enableShutdownHooks(); // Handle graceful shutdown

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

