import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    description: 'The name of the user',
    type: String,
  })
  name: string;

  @ApiProperty({
    description: 'The password for the user account',
    type: String,
    minLength: 6, // Add any validation you need
  })
  password: string;

  @ApiProperty({
    description: 'The email address of the user (must be unique)',
    type: String,
  })
  email: string;

  @ApiProperty({
    description: 'The Cognito sub (user identifier)',
    type: String,
  })
  sub: string; // Add sub attribute for user identification
}

export class UpdateUserDto {
  @ApiProperty({
    description: 'The email address of the user to update',
    type: String,
  })
  email: string;

  @ApiProperty({
    description: 'The list of attributes to update (e.g., name, etc.)',
    type: [Object], // Update with the correct type if needed
    required: false, // Adjust based on your requirements
  })
  attributes?: { Name: string; Value: string }[];

  @ApiProperty({
    description: 'The Cognito sub (user identifier) of the user to update',
    type: String,
  })
  sub: string; // Add sub attribute to update based on the Cognito user identifier
}

