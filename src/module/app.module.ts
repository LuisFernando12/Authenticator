import { AuthModule } from '@/auth/infrastructure/module/auth.module';
import { ClientModule } from '@/client/infrastructure/module/client.module';
import { TokenModule } from '@/token/infrastructure/module/token.module';
import { UserModule } from '@/user/infrastructure/module/user.module';
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppConfigEnvService } from '../core/domain/service/app-config-env.service';
import { AppConfigModule } from '../core/infrastructure/module/app-config.module';
import { AuthenticatorLoggerModule } from '../core/infrastructure/module/auth-logger.module';
import { HealthModule } from '../core/infrastructure/module/health.module';
import { MFAModule } from '../mfa/infrastructure/module/mfa.module';
import { OauthModule } from '../oauth/infrastructure/module/oauth.module';
import { SecurityEventModule } from '../security-event/infrastructure/module/security-event.module';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    AppConfigModule,
    TypeOrmModule.forRootAsync({
      inject: [AppConfigEnvService],
      useFactory: (config: AppConfigEnvService) => {
        return {
          type: 'postgres',
          host: config.hostDB,
          port: config.portDB,
          username: config.userDB,
          password: config.passwordDB,
          database: config.nameDB,
          synchronize: false,
          autoLoadEntities: true,
          migrationsRun: true,
          invalidWhereValuesBehavior: {
            null: 'throw',
            undefined: 'throw',
          },
        };
      },
    }),
    ThrottlerModule.forRootAsync({
      useFactory: () => ({
        throttlers: [
          {
            ttl: 60000,
            limit: 5,
          },
        ],
        errorMessage: 'Too many requests, please try again later.',
      }),
    }),
    AuthModule,
    UserModule,
    TokenModule,
    ClientModule,
    OauthModule,
    HealthModule,
    AuthenticatorLoggerModule,
    SecurityEventModule,
    MFAModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
