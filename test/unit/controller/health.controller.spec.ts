import {
  HealthCheckResult,
  HealthCheckService,
  HealthCheckStatus,
  MicroserviceHealthIndicator,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import { Test, TestingModule } from '@nestjs/testing';
import {
  HealthController,
  IHealthController,
} from '../../../src/controller/health.controller';
import { AppConfigEnvService } from '../../../src/service/app-config-env.service';
import { mockAppconfigEnvService } from '../mock/appConfigEnv.mock';

describe('HealthController', () => {
  let healthController: IHealthController;
  let healthCheckService: {
    check: jest.Mock;
  };
  let db: {
    pingCheck: jest.Mock;
  };
  let redis: {
    pingCheck: jest.Mock;
  };
  const mockHealthObject: HealthCheckResult = {
    status: 'ok' as HealthCheckStatus,
    info: {
      database: {
        status: 'up',
      },
      redis: {
        status: 'up',
      },
    },
    error: {},
    details: {
      database: {
        status: 'up',
      },
      redis: {
        status: 'up',
      },
    },
  };
  beforeEach(async () => {
    healthCheckService = {
      check: jest.fn().mockResolvedValue(mockHealthObject),
    };
    db = {
      pingCheck: jest.fn().mockResolvedValueOnce({
        database: {
          status: 'up',
        },
      }),
    };
    redis = {
      pingCheck: jest.fn().mockResolvedValueOnce({
        redis: {
          status: 'up',
        },
      }),
    };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthCheckService,
          useValue: healthCheckService,
        },
        {
          provide: TypeOrmHealthIndicator,
          useValue: db,
        },

        {
          provide: MicroserviceHealthIndicator,
          useValue: redis,
        },
        {
          provide: AppConfigEnvService,
          useValue: mockAppconfigEnvService,
        },
      ],
    }).compile();
    healthController = module.get<IHealthController>(HealthController);
  });
  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(healthController).toBeDefined();
  });
  describe('check', () => {
    it('should return health check', async () => {
      const result = await healthController.check();
      expect(result).toEqual(mockHealthObject);
    });
    it('should call health.check with two indicators', async () => {
      await healthController.check();

      expect(healthCheckService.check).toHaveBeenCalledWith([
        expect.any(Function),
        expect.any(Function),
      ]);
    });
    it('should call db.pingCheck with "database"', async () => {
      await healthController.check();
      const [database] = healthCheckService.check.mock.calls[0];
      await database[0]();
      expect(db.pingCheck).toHaveBeenCalledWith('database');
    });
    it('should call redis.pingCheck with "redis"', async () => {
      await healthController.check();
      const [redisIndicator] = healthCheckService.check.mock.calls[0];
      await redisIndicator[1]();
      expect(redis.pingCheck).toHaveBeenCalledWith('redis', {
        transport: 1,
        options: {
          password: 'password',
        },
      });
    });
  });
});
