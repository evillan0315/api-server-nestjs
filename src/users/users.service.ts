import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminGetUserCommand,
  AdminUpdateUserAttributesCommand,
  AdminDeleteUserCommand,
  ListUsersCommand,
  AdminCreateUserCommandOutput,
  AdminGetUserCommandOutput,
  AdminSetUserPasswordCommand
} from '@aws-sdk/client-cognito-identity-provider';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, } from '@nestjs/swagger';
import * as dotenv from 'dotenv';
import { CreateUserDto, UpdateUserDto } from './dto/users.dto';
import { v4 as uuidv4 } from 'uuid'; // Import UUID generation
import { PrismaService } from '../prisma/prisma.service';
dotenv.config();

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION!,
});

const userPoolId = process.env.AWS_USER_POOL_ID!;

@ApiTags('Users')
@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}
  
  async generateUserApiKey(user: any) {
	  const apiKey = uuidv4();

	  try {
	    if (!user.id) {
		throw new UnauthorizedException('Failed to fetch  user info');
	      }
	    const newApiKey = await this.prisma.apiKey.create({
	      data: {
		userId: user.id,
		apiKey,
	      },
	    });

	    return newApiKey.apiKey;
	  } catch (error) {
	    console.error("Prisma API Key Insert Error:", error);
	    throw new Error("Failed to store API key in database");
	  }
  }
  async validateUserApiKey(apiKey: string): Promise<{ valid: boolean; user?: any }> {
  try {
    const existingKey = await this.prisma.apiKey.findUnique({
      where: { apiKey },
      include: { User: true },
    });

    if (!existingKey) {
      throw new UnauthorizedException("Invalid API Key");
    }

    return {
      valid: true,
      user: existingKey.User, // Include user details
    };
  } catch (error) {
    console.error("API Key Validation Error:", error);
    throw new UnauthorizedException("API Key validation failed");
  }
}
  async getProfile(user: any) {
	  try {
	
	    


            const username = user.email || user.username || user.userId; // Fallback to userId if username is missing

		if (!username) {
		  throw new Error("Username is required but missing.");
		}
	    if (!user?.username) {
	      throw new Error("Missing username in user object.");
	    }

	    const command = new AdminGetUserCommand({
	      UserPoolId: userPoolId,
	      Username: user.username, // Use email as a fallback
	    });

	    const response = await cognitoClient.send(command);
	    console.log("Cognito Response:", response); // Debugging

	    const userAttributes = response.UserAttributes?.reduce(
	      (acc, attr: { Name: string; Value?: string }) => {
		if (attr.Name && attr.Value !== undefined) {
		  acc[attr.Name] = attr.Value;
		}
		return acc;
	      },
	      {} as Record<string, string>
	    ) || {};

	    const userData = {
	      cognitoId: userAttributes["sub"] || undefined,
	      username: response.Username || userAttributes["preferred_username"] || userAttributes["email"] || undefined,
	      email: userAttributes["email"] || undefined,
	    };

	    if (!userData.username) {
	      throw new Error("Username is missing in Cognito response.");
	    }

	    let iuser = await this.prisma.user.findUnique({
	      where: { email: userData.email },
	    });
            
	    if (!iuser) {
	      iuser = await this.prisma.user.create({
		data: {
		  cognitoId: userData.cognitoId,
		  username: userData.username,
		  email: userData.email as string,
		},
	      });
	    } else if (iuser.id && !iuser.cognitoId) {
	      iuser = await this.prisma.user.update({
		where: { id: iuser.id },
		data: { cognitoId: userData.cognitoId, username: userData.username },
	      });
	    }

	    return iuser;
	  } catch (error: any) {
	    console.error("Error fetching user profile:", error.message);
	    throw new Error(error.message || "Failed to fetch user");
	  }
	}

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
  async createUser(email: string, name: string, password: string): Promise<AdminCreateUserCommandOutput> {
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

      await cognitoClient.send(command);
      const setPasswordCommand = new AdminSetUserPasswordCommand({
    UserPoolId: process.env.AWS_USER_POOL_ID!,
    Username: email,
    Password: password,
    Permanent: true, // <-- This is the key!
  });

  await cognitoClient.send(setPasswordCommand);

      const profile = await this.getProfile({"username":email,"email":email});
     
      return {
	  ...profile,
	  $metadata: { httpStatusCode: 200 }, // Add fake metadata to satisfy TypeScript
	};

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

  @ApiOperation({ summary: 'Get user by Cognito userId (sub)' })
  @ApiParam({
    name: 'userId',
    description: 'The unique identifier of the user (Cognito sub)',
    type: String,
    example: 'c9eee4d8-8001-7020-92c3-84aab9148595',
  })
  @ApiResponse({ status: 200, description: 'User found', schema: {
    type: 'object',
    properties: {
      userId: { type: 'string', example: 'c9eee4d8-8001-7020-92c3-84aab9148595' },
      email: { type: 'string', example: 'user@example.com' },
      username: { type: 'string', example: 'user@example.com' },
    },
  }})
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserById(userId: string) {
    try {
      const command = new AdminGetUserCommand({
        UserPoolId: process.env.COGNITO_USER_POOL_ID,
        Username: userId, // Cognito uses `sub` as the unique identifier
      });

      const response = await cognitoClient.send(command);

      return {
        userId: response.UserAttributes?.find(attr => attr.Name === 'sub')?.Value,
        email: response.UserAttributes?.find(attr => attr.Name === 'email')?.Value,
        username: response.Username,
      };
    } catch (error) {
      return null; // Return null so controller can throw 404
    }
  }
  async getUserByCognitoId(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
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

