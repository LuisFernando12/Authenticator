import { Module } from '@nestjs/common';
import { AppConfigEnvService } from '../../domain/service/app-config-env.service';
import { RedisService } from '../../domain/service/redis.service';
import { RedisServiceImplement } from '../service/redis.service';
import { AppConfigModule } from './app-config.module';

@Module({
  imports: [AppConfigModule],
  providers: [
    {
      provide: RedisService,
      useFactory: (appConfigEnvService: AppConfigEnvService) =>
        new RedisServiceImplement(appConfigEnvService),
      inject: [AppConfigEnvService],
    },
  ],
  exports: [RedisService],
})
export class RedisModule {}
