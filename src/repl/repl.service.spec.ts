import { Test, TestingModule } from '@nestjs/testing';
import { ReplService } from './repl.service';

describe('ReplService', () => {
  let service: ReplService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReplService],
    }).compile();

    service = module.get<ReplService>(ReplService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
