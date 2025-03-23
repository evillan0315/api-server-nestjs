import { Injectable } from '@nestjs/common';
import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminGetUserCommand,
  AdminUpdateUserAttributesCommand,
  AdminDeleteUserCommand,
  ListUsersCommand,
  AdminCreateUserCommandOutput,
  AdminGetUserCommandOutput,
} from '@aws-sdk/client-cognito-identity-provider';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import * as dotenv from 'dotenv';
import { CreateUserDto, UpdateUserDto } from './dto/users.dto';
import { v4 as uuidv4 } from 'uuid'; // Import UUID generation
dotenv.config();

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION!,
});

const userPoolId = process.env.AWS_USER_POOL_ID!;

@ApiTags('Users')
@Injectable()
export class UsersService {
  // ✅ Create User
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User successfully created' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiBody({
    description: 'Create a user by providing email, name',
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string' },
        name: { type: 'string' },
      },
    },
  })
  async createUser(email: string, name: string): Promise<AdminCreateUserCommandOutput> {
    try {
      const command = new AdminCreateUserCommand({
        UserPoolId: process.env.AWS_USER_POOL_ID!,
        Username: email, // Use email as the unique identifier
        UserAttributes: [
          { Name: 'email', Value: email },
          { Name: 'name', Value: name },
        ],
        MessageAction: 'SUPPRESS', // Prevents sending invitation email
      });

      const response = await cognitoClient.send(command);
      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create user');
    }
  }

  // ✅ Get User by Username (email)
  @ApiOperation({ summary: 'Get user by email (Cognito username)' })
  @ApiParam({
    name: 'email',
    description: 'The unique identifier of the user to fetch (email)',
    type: String,
  })
  @ApiResponse({ status: 200, description: 'User found' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUser(email: string): Promise<AdminGetUserCommandOutput> {
    try {
      const command = new AdminGetUserCommand({
        UserPoolId: userPoolId,
        Username: email, // Use email as the unique identifier
      });

      const response = await cognitoClient.send(command);
      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch user');
    }
  }

  // ✅ Update User by Username (email)
  @ApiOperation({ summary: 'Update user attributes by email (Cognito username)' })
  @ApiParam({
    name: 'email',
    description: 'The unique identifier of the user to update (email)',
    type: String,
  })
  @ApiResponse({ status: 200, description: 'User successfully updated' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiBody({
    description: 'Provide the user attributes to update',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          Name: { type: 'string' },
          Value: { type: 'string' },
        },
      },
    },
  })
  async updateUser(email: string, attributes: { Name: string; Value: string }[]): Promise<{ message: string }> {
    try {
      const command = new AdminUpdateUserAttributesCommand({
        UserPoolId: userPoolId,
        Username: email, // Use email as the unique identifier
        UserAttributes: attributes,
      });

      await cognitoClient.send(command);
      return { message: 'User updated successfully' };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update user');
    }
  }

  // ✅ Delete User by Username (email)
  @ApiOperation({ summary: 'Delete user by email (Cognito username)' })
  @ApiParam({
    name: 'email',
    description: 'The unique identifier of the user to delete (email)',
    type: String,
  })
  @ApiResponse({ status: 200, description: 'User successfully deleted' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async deleteUser(email: string): Promise<{ message: string }> {
    try {
      const command = new AdminDeleteUserCommand({
        UserPoolId: userPoolId,
        Username: email, // Use email as the unique identifier
      });

      await cognitoClient.send(command);
      return { message: 'User deleted successfully' };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete user');
    }
  }

  // ✅ List Users
  @ApiOperation({ summary: 'List all users' })
  @ApiResponse({ status: 200, description: 'List of users' })
  async listUsers() {
    try {
      const command = new ListUsersCommand({
        UserPoolId: userPoolId,
      });

      const response = await cognitoClient.send(command);
      return response.Users;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to list users');
    }
  }
}

