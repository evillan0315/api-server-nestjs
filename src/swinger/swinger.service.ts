// src/swinger/swinger.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSwingerDto, UpdateSwingerDto } from './dto/swinger.dto';

interface JsonData {
  USERID: number;
  EMAIL: string;
  NAME: string;
  [key: string]: any;
}

interface Member {
  json_data: JsonData;
}

interface Item {
  member?: Member;
}

@Injectable()
export class SwingerService {
  constructor(private prisma: PrismaService) {}
  async getTotalCount(): Promise<number> {
    return this.prisma.swingers.count();
  }
  async create(createSwingerDto: CreateSwingerDto) {
    return this.prisma.swingers.create({
      data: {
        email: createSwingerDto.email,
        name: createSwingerDto.name,
        swingerID: createSwingerDto.swingerID,
        jsonData: createSwingerDto.jsonData,
      },
    });
  }

  async update(swingerID: string, updateSwingerDto: UpdateSwingerDto) {
    return this.prisma.swingers.update({
      where: { swingerID },
      data: updateSwingerDto,
    });
  }

  async findAll(limit?: number) {
  return this.prisma.swingers.findMany({
    take: limit,
    select: {
    id: true,
    name: true,
    email: true,
    swingerID: true,
  }, // Limits the number of results if 'limit' is provided
  });
}

  async findOne(swingerID: string) {
    return this.prisma.swingers.findUnique({
      where: { swingerID },
    });
  }

  async fetchDataFromAPI(apiUrl: string): Promise<void> {
    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const jsonData: Item[] = await response.json();

      if (!Array.isArray(jsonData)) {
        throw new Error('Invalid data format: Expected an array');
      }

      const uniqueJsonData: JsonData[] = [];
      const userIds = new Set<number>();

      jsonData.forEach((item: Item) => {
        if (item.member?.json_data) {
          const jsonData = item.member.json_data;

          if (!userIds.has(jsonData.USERID)) {
            userIds.add(jsonData.USERID);
            uniqueJsonData.push(jsonData);
          }
        }
      });

      return await this.saveToDatabase(uniqueJsonData);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }

  async saveToDatabase(data: JsonData[]): Promise<any> {
    try {
      for (const jsonData of data) {
        await this.prisma.swingers.upsert({
          where: { swingerID: String(jsonData.USERID) },
          update: { jsonData: jsonData },
          create: {
            email: jsonData.EMAIL || '',
            name: jsonData.NAME || '',
            swingerID: String(jsonData.USERID),
            jsonData: jsonData,
          },
        });
      }
      return {"message": 'Data successfully saved to the database'};
    } catch (error) {
      console.error('Error saving data to the database:', error);
    } finally {
      await this.prisma.$disconnect();
    }
  }
}

