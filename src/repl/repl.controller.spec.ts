import { Test, TestingModule } from '@nestjs/testing';
import { ReplController } from './repl.controller';

describe('ReplController', () => {
  let controller: ReplController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReplController],
    }).compile();

    controller = module.get<ReplController>(ReplController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
