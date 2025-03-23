import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaModule } from '../prisma/prisma.module'; // <-- Import PrismaModule

@Module({
  imports: [PrismaModule], // <-- Add PrismaModule here
  providers: [UsersService],
  controllers: [UsersController]
})
export class UsersModule {}
