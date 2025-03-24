import { Controller, Post, Get, Delete, Body, Query, UseGuards, Param, Res, StreamableFile, Header } from '@nestjs/common';
import { FileService } from './file.service';

import { ApiTags, ApiOperation, ApiQuery, ApiBody, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CognitoAuthGuard } from '../auth/guard/auth.guard';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import * as mime from 'mime-types'; // Import MIME type detection
@ApiTags('File Management')
@ApiBearerAuth() // Enables JWT authentication in Swagger
@Controller('file')
@UseGuards(CognitoAuthGuard) // Protect all routes
export class FileController {
  constructor(private readonly fileService: FileService) {}
   @Get('raw/:filePath')
  async getFile(@Param('filePath') filePath: string, @Res() res: Response): Promise<any> {
    try {
     
      if (!fs.existsSync(filePath)) {
        return res.status(404).send('File not found');
      }

      const fileExtension = path.extname(filePath).toLowerCase();
      const mimeTypes: Record<string, string> = {
        '.txt': 'text/plain',
        '.json': 'application/json',
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'application/javascript',
        '.ts': 'application/typescript',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.bmp': 'image/bmp',
        '.webp': 'image/webp',
      };

      const mimeType = mimeTypes[fileExtension] || 'application/octet-stream';

      res.setHeader('Content-Type', mimeType);
      const fileStream = fs.createReadStream(filePath);
      return fileStream.pipe(res);
    } catch (error) {
      return res.status(500).send('Error reading file');
    }
  }
  @Get('list')
@ApiOperation({ summary: 'List files in a directory' })
@ApiQuery({ name: 'directory', required: false, description: 'Path to the directory' })
@ApiQuery({ name: 'recursive', required: false, type: Boolean, description: 'List files recursively' })
@ApiResponse({ status: 200, description: 'List of files and directories' })
async getFiles(
  @Query('directory') directory?: string,
  @Query('recursive') recursive: boolean = false
) {
  return this.fileService.getFilesByDirectory(directory, recursive);
}

  @Get('content')
  @ApiOperation({ summary: 'Get file content' })
  @ApiQuery({ name: 'filePath', required: true, description: 'Path to the file' })
  
  @ApiResponse({ status: 200, description: 'File content returned successfully' })
  async getFileContent(
  @Query('filePath') filePath: string
  ) {
    return this.fileService.getFileContent(filePath);
  }

  @Post('create')
  @ApiOperation({ summary: 'Create or update a file' })
  @ApiBody({ schema: { type: 'object', properties: { path: { type: 'string' }, content: { type: 'string' } } } })
  @ApiResponse({ status: 201, description: 'File created/updated successfully' })
  async createOrUpdate(@Body() body: { path: string; content?: string }) {
    return this.fileService.createOrUpdateFile(body.path, body.content);
  }

  @Get('read')
  @ApiOperation({ summary: 'Read file content' })
  @ApiQuery({ name: 'path', required: true, description: 'Path to the file' })
  @ApiResponse({ status: 200, description: 'File read successfully' })
  async read(@Query('path') path: string) {
    return this.fileService.readFile(path);
  }

  @Delete('delete')
  @ApiOperation({ summary: 'Delete a file or folder' })
  @ApiQuery({ name: 'path', required: true, description: 'Path to the file or folder' })
  @ApiResponse({ status: 200, description: 'File or folder deleted successfully' })
  async delete(@Query('path') path: string) {
    return this.fileService.deleteFileOrFolder(path);
  }
}

