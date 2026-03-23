import { Test, TestingModule } from '@nestjs/testing';
import { AuthLogger } from '../../../src/config/logger/auth-logger.config';
import { AppConfigEnvService } from '../../../src/service/app-config-env.service';
import { RedisService } from '../../../src/service/redis.service';
import { mockAppconfigEnvService } from '../mock/appConfigEnv.mock';
import { mockAuthLogger } from '../mock/logger.mock';
jest.mock('ioredis', () => {
  class Redis {
    ping = jest.fn().mockResolvedValue('PONG');
    quit = jest.fn().mockResolvedValue('OK');
    get = jest.fn();
    set = jest.fn();
    del = jest.fn();
    exists = jest.fn();
    on = jest.fn();
  }
  return {
    Redis,
  };
});

describe('RedisService', () => {
  let redisService: RedisService;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisService,
        {
          provide: AppConfigEnvService,
          useValue: mockAppconfigEnvService,
        },
        {
          provide: AuthLogger,
          useValue: mockAuthLogger,
        },
      ],
    }).compile();
    redisService = module.get<RedisService>(RedisService);
  });
  afterEach(async () => {
    jest.clearAllMocks();
    await redisService.onModuleDestroy();
  });
  it('should be defined', () => {
    expect(redisService).toBeDefined();
  });
  describe('onModuleInit', () => {
    it('should call ping method', async () => {
      await redisService.onModuleInit();
      expect(redisService.ping).toHaveBeenCalled();
    });
  });
  describe('onModuleDestroy', () => {
    it('should call quit method', async () => {
      await redisService.onModuleDestroy();
      expect(redisService.quit).toHaveBeenCalled();
    });
  });
});
