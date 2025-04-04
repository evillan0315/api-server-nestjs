import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { FileModule } from './file/file.module';
import { JwtStrategy } from './auth/cognito.strategy/cognito.strategy';
import { CognitoAuthGuard } from './auth/jwt-auth.guard/jwt-auth.guard.guard';
import { PrismaModule } from './prisma/prisma.module';
import { ChatgptModule } from './chatgpt/chatgpt.module';
import { GoogleGeminiModule } from './google-gemini/google-gemini.module';
import { WebsocketModule } from './websocket/websocket.module';
import { DynamoDBModule } from './dynamodb/dynamodb.module';
import { SwingerModule } from './swinger/swinger.module';
import { ReplModule } from './repl/repl.module';
import { GithubModule } from './github/github.module';
import { LogModule } from './log/log.module';

@Module({
  imports: [AuthModule, UsersModule, FileModule, PrismaModule, ChatgptModule, GoogleGeminiModule, WebsocketModule, DynamoDBModule, SwingerModule, ReplModule, GithubModule, LogModule],
  controllers: [AppController],
  providers: [AppService, JwtStrategy, CognitoAuthGuard],
  exports: [CognitoAuthGuard], 
})
export class AppModule {}
