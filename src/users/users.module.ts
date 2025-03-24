import { Module, forwardRef } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { ApiKeyAuthGuard } from '../auth/guard/api-key.guard';

@Module({
  imports: [PrismaModule, forwardRef(() => AuthModule)], // ✅ Use forwardRef here too
  providers: [UsersService, ApiKeyAuthGuard],
  controllers: [UsersController],
  exports: [UsersService], // ✅ Export UsersService for AuthModule
})
export class UsersModule {}

