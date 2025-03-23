import { Test, TestingModule } from '@nestjs/testing';
import { SwingerService } from './swinger.service';

describe('SwingerService', () => {
  let service: SwingerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SwingerService],
    }).compile();

    service = module.get<SwingerService>(SwingerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
