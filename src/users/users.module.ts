import { Module, forwardRef } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    PrismaModule, 
    forwardRef(() => AuthModule), // ✅ Fix circular dependency
  ],
  providers: [UsersService], // ❌ Removed `ApiKeyAuthGuard` (should stay in AuthModule)
  controllers: [UsersController],
  exports: [UsersService], // ✅ Export only what’s needed
})
export class UsersModule {}

