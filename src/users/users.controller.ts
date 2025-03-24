import { Controller, Post, Get, Param, Put, Delete, Body, Req, UseGuards, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { CreateUserDto, UpdateUserDto } from './dto/users.dto';
import { UsersService } from './users.service';
import { CognitoAuthGuard } from '../auth/guard/auth.guard';
import { ApiKeyAuthGuard } from '../auth/guard/api-key.guard';
import { Request } from 'express';

@ApiTags('Users')
@ApiBearerAuth() // Enables JWT authentication in Swagger
@Controller('api/users')
@UseGuards(CognitoAuthGuard) // Protect all routes
export class UsersController {
  constructor(private readonly userService: UsersService) {}
  @Get('me')
  //@UseGuards(ApiKeyAuthGuard)
  @ApiOperation({ summary: 'Get current logged-in user' })
  @ApiResponse({ status: 200, description: 'Returns the current user profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@Req() request: Request) {
   //return this.userService.getUser(request?.user)
   console.log('get profile in usercontroller', request.user)
    return this.userService.getProfile(request.user);
  }
  
  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, description: 'User successfully created' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createUser(@Body() createUserDto: CreateUserDto) {
    const { email, name, password } = createUserDto;
    return this.userService.createUser(email, name, password);
  }

  @Get()
  @ApiOperation({ summary: 'List all users' })
  @ApiResponse({ status: 200, description: 'List of users' })
  async listUsers() {
    return this.userService.listUsers();
  }
  // ✅ New endpoint: Get User by Cognito User ID (sub)
  @Get('id/:userId')
  @ApiOperation({ summary: 'Get user by Cognito User ID (sub)' })
  @ApiParam({
    name: 'userId',
    description: 'The unique Cognito User ID (sub)',
    type: String,
    example: 'c9eee4d8-8001-7020-92c3-84aab9148595',
  })
  @ApiResponse({
    status: 200,
    description: 'User found',
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string', example: 'c9eee4d8-8001-7020-92c3-84aab9148595' },
        email: { type: 'string', example: 'user@example.com' },
        username: { type: 'string', example: 'user@example.com' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserByUserId(@Param('userId') userId: string) {
    const user = await this.userService.getUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  @Get(':username')
  @ApiOperation({ summary: 'Get user by username (email)' })
  @ApiParam({ name: 'username', description: 'The username (email) of the user to fetch' })
  @ApiResponse({ status: 200, description: 'User found' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUser(@Param('username') username: string) {
    return this.userService.getUser(username); // Use username to fetch user
  }

  @Put(':username')
  @ApiOperation({ summary: 'Update user attributes by username' })
  @ApiParam({ name: 'username', description: 'The username (email) of the user to update' })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, description: 'User successfully updated' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateUser(
    @Param('username') username: string,  // Use username to update user
    @Body() updateUserDto: UpdateUserDto,
  ) {
    if (!updateUserDto.attributes || updateUserDto.attributes.length === 0) {
      throw new Error('Attributes are required');
    }

    return this.userService.updateUser(username, updateUserDto.attributes); // Use username to update
  }

  @Delete(':username')
  @ApiOperation({ summary: 'Delete a user by username' })
  @ApiParam({ name: 'username', description: 'The username (email) of the user to delete' })
  @ApiResponse({ status: 200, description: 'User successfully deleted' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async deleteUser(@Param('username') username: string) {
    return this.userService.deleteUser(username); // Use username to delete user
  }
}

