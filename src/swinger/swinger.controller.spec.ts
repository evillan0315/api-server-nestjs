import { Test, TestingModule } from '@nestjs/testing';
import { SwingerController } from './swinger.controller';

describe('SwingerController', () => {
  let controller: SwingerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SwingerController],
    }).compile();

    controller = module.get<SwingerController>(SwingerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
