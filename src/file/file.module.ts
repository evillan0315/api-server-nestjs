import { Module } from '@nestjs/common';
import { FileService } from './file.service';
import { FileController } from './file.controller';

@Module({
  providers: [
    FileService,
    {
      provide: 'EXCLUDED_FOLDERS',
      useValue: ['node_modules', 'dist'], // Example folders to exclude
    },
  ],
  controllers: [FileController],
  exports: [FileService],
})
export class FileModule {}
