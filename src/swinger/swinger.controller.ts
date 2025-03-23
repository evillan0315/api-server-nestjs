// src/swinger/swinger.controller.ts
import { Controller, Get, Post, Body, Param, Put, UseGuards, Query } from '@nestjs/common';
import { SwingerService } from './swinger.service';
import { CreateSwingerDto, UpdateSwingerDto } from './dto/swinger.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

import { CognitoAuthGuard } from '../auth/jwt-auth.guard/jwt-auth.guard.guard';


@ApiTags('Swingers')
@Controller('swingers')
@ApiBearerAuth() // Enables JWT authentication in Swagger
@UseGuards(CognitoAuthGuard) // Protect all routes
export class SwingerController {
  constructor(private readonly swingerService: SwingerService) {}
  @Get('count')
  @ApiOperation({ summary: 'Get total count of swingers' })
  @ApiResponse({ status: 200, description: 'Total count of swingers returned' })
  async getTotalCount() {
    return this.swingerService.getTotalCount();
  }
  @Post()
  @ApiOperation({ summary: 'Create a new swinger record' })
  @ApiResponse({ status: 201, description: 'The swinger has been successfully created.' })
  create(@Body() createSwingerDto: CreateSwingerDto) {
    return this.swingerService.create(createSwingerDto);
  }

  @Put(':swingerID')
  @ApiOperation({ summary: 'Update a swinger record' })
  @ApiResponse({ status: 200, description: 'The swinger has been successfully updated.' })
  update(
    @Param('swingerID') swingerID: string,
    @Body() updateSwingerDto: UpdateSwingerDto,
  ) {
    return this.swingerService.update(swingerID, updateSwingerDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get a list of swingers' })
  @ApiResponse({ status: 200, description: 'List of swingers' })
  @ApiQuery({
    name: 'limit',
    type: Number,
    required: false,
    description: 'Number of swingers to retrieve (optional)',
    example: 10,
  })
  findAll(@Query('limit') limit?: number) {
    return this.swingerService.findAll(limit ? Number(limit) : undefined);
  }

  @Get(':swingerID')
  @ApiOperation({ summary: 'Get a specific swinger record' })
  @ApiResponse({ status: 200, description: 'The swinger record has been retrieved.' })
  findOne(@Param('swingerID') swingerID: string) {
    return this.swingerService.findOne(swingerID);
  }
  @Post('fetch-data')
  @ApiOperation({ summary: 'Fetch data from external API and save to the database' })
  @ApiResponse({ status: 200, description: 'Data fetched and saved successfully.' })
  @ApiResponse({ status: 400, description: 'Error fetching or saving data.' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        apiUrl: {
          type: 'string',
          example: 'https://api.example.com/data',
          description: 'The external API URL to fetch data from.',
        },
      },
      required: ['apiUrl'],
    },
  })
  async fetchData(@Body('apiUrl') apiUrl: string) {
    return this.swingerService.fetchDataFromAPI(apiUrl);
  }
}

