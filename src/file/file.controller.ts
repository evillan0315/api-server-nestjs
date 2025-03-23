import { Controller, Post, Get, Delete, Body, Query, UseGuards } from '@nestjs/common';
import { FileService } from './file.service';

import { ApiTags, ApiOperation, ApiQuery, ApiBody, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CognitoAuthGuard } from '../auth/jwt-auth.guard/jwt-auth.guard.guard';

@ApiTags('File Management')
@ApiBearerAuth() // Enables JWT authentication in Swagger
@Controller('file')
@UseGuards(CognitoAuthGuard) // Protect all routes
export class FileController {
  constructor(private readonly fileService: FileService) {}

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
  async getFileContent(@Query('filePath') filePath: string) {
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

