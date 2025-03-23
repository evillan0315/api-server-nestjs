import { Test, TestingModule } from '@nestjs/testing';
import { CognitoStrategy } from './cognito.strategy';

describe('CognitoStrategy', () => {
  let provider: CognitoStrategy;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CognitoStrategy],
    }).compile();

    provider = module.get<CognitoStrategy>(CognitoStrategy);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
