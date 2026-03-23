import { AppConfigEnvService } from '@/service/app-config-env.service';
import { Controller, Get } from '@nestjs/common';
import { Transport } from '@nestjs/microservices';
import {
  HealthCheck,
  HealthCheckService,
  MicroserviceHealthIndicator,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';
export interface IHealthController {
  check: () => Promise<any>;
}
@Controller('health')
export class HealthController implements IHealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private redis: MicroserviceHealthIndicator,
    private appConfigEnvService: AppConfigEnvService,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    const passwordRedis = this.appConfigEnvService.redisURI
      .split(':')[2]
      .split('@')[0];
    return this.health.check([
      () => this.db.pingCheck('database'),
      () =>
        this.redis.pingCheck('redis', {
          transport: Transport.REDIS,
          options: {
            password: passwordRedis,
          },
        }),
    ]);
  }
}
