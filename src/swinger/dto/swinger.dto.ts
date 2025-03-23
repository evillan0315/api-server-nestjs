// src/swinger/dto/create-swinger.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateSwingerDto {
  @ApiProperty({
    description: 'The email of the swinger',
    example: 'example@example.com',
  })
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'The name of the swinger',
    example: 'John Doe',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'The unique swinger ID',
    example: '12345',
  })
  @IsString()
  @IsNotEmpty()
  swingerID: string;

  @ApiPropertyOptional({
    description: 'Optional JSON data associated with the swinger',
    example: { hobbies: ['sports', 'music'] },
  })
  @IsOptional()
  jsonData: any; // If jsonData is optional, use IsOptional
}

export class UpdateSwingerDto {
  @ApiPropertyOptional({
    description: 'The updated email of the swinger',
    example: 'new-email@example.com',
  })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({
    description: 'The updated name of the swinger',
    example: 'Jane Doe',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Updated JSON data associated with the swinger',
    example: { hobbies: ['traveling', 'coding'] },
  })
  @IsOptional()
  jsonData?: Record<string, any>;
}

