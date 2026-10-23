import { Module } from '@nestjs/common';
import { AppConfigEnvService } from '../../domain/service/app-config-env.service';
import { REDIS_SERVICE_PORT } from '../../domain/service/redis.service';
import { RedisServiceImplement } from '../service/redis.service';
import { AppConfigModule } from './app-config.module';

@Module({
  imports: [AppConfigModule],
  providers: [
    {
      provide: REDIS_SERVICE_PORT,
      useFactory: (appConfigEnvService: AppConfigEnvService) =>
        new RedisServiceImplement(appConfigEnvService),
      inject: [AppConfigEnvService],
    },
  ],
  exports: [REDIS_SERVICE_PORT],
})
export class RedisModule {}
