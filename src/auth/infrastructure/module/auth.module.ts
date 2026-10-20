import { AuthController } from '@/auth/infrastructure/controller/auth.controller';
import { TokenModule } from '@/token/infrastructure/module/token.module';
import { UserModule } from '@/user/infrastructure/module/user.module';
import {
  IUserRepository,
  UserRepository,
} from '@/user/infrastructure/persistence/repository/user.repository';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfigEnvService } from '../../../core/domain/service/app-config-env.service';
import { RedisService } from '../../../core/domain/service/redis.service';

import { EventEmitter2 } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import { RedisServiceImplement } from '../../../core/infrastructure/service/redis.service';
import { EmailModule } from '../../../email/infrastructure/module/email.module';
import { EmailQueue } from '../../../email/infrastructure/queue/email.queue';
import { TokenService } from '../../../token/application/service/token.service';
import {
  CONFIG_SERVICE_PORT,
  ConfigServicePort,
} from '../../application/port/config-service.port';
import {
  EMAIL_SERVICE_PORT,
  EmailServicePort,
} from '../../application/port/email-service.port';
import {
  GENERATE_OTP_SERVICE_PORT,
  GenerateOtpServicePort,
} from '../../application/port/generate-otp-service.port';
import {
  REDIS_SERVICE_PORT,
  RedisServicePort,
} from '../../application/port/redis-service.port';
import {
  SECURITY_EVENT_PORT,
  SecurityEventPort,
} from '../../application/port/security-event.port';
import {
  TEMP_PASSWORD_SERVICE_PORT,
  TempPasswordServicePort,
} from '../../application/port/temp-password.port';
import {
  TOKEN_SERVICE_PORT,
  TokenServicePort,
} from '../../application/port/token-service.port';
import {
  USER_REPOSITORY_PORT,
  UserRepositoryPort,
} from '../../application/port/user-repository.port';
import {
  USER_VALIDATE_CREDENTIALS_SERVICE_PORT,
  UserValidateCredentialsServicePort,
} from '../../application/port/user-validate-credentials-service.port';
import { ActiveAccountUseCase } from '../../application/use-case/active-account.use-case';
import { LoginUseCase } from '../../application/use-case/login.use-case';
import { NewPasswordUseCase } from '../../application/use-case/new-password.use-case';
import { ResetPasswordUseCase } from '../../application/use-case/reset-password.use-case';
import { SendNewTokenToEmailActiveUseCase } from '../../application/use-case/send-new-token-to-email-active.use-case';
import { UnblockAccountUseCase } from '../../application/use-case/unblock-account.use-case';
import { ConfigServiceAdapter } from '../adapter/config-service.adapter';
import { EmailServiceAdapter } from '../adapter/email-service.adapter';
import { GenerateOtpServiceAdapter } from '../adapter/generate-otp-service.adapter';
import { RedisServiceAdapter } from '../adapter/redis-service.adapter';
import { SecurityEventAdapter } from '../adapter/security-event.adapter';
import { TempPasswordServiceAdapter } from '../adapter/temp-password-service.adapter';
import { TokenServiceAdapter } from '../adapter/token-service.adapter';
import { UserValidateCredentialsServiceAdapter } from '../adapter/user-validate-credential-service.adapter';
import { AuthGuard } from '../guard/auth.guard';
import { UserRepositoryAdapter } from './../adapter/user-repository.adapter';

@Module({
  imports: [TokenModule, UserModule, EmailModule],
  controllers: [AuthController],
  providers: [
    {
      provide: AppConfigEnvService,
      useFactory: (configService: ConfigService) =>
        new AppConfigEnvService(configService),
      inject: [ConfigService],
    },
    {
      provide: RedisService,
      useFactory: (appConfigEnvService: AppConfigEnvService) =>
        new RedisServiceImplement(appConfigEnvService),
      inject: [AppConfigEnvService],
    },
    {
      provide: USER_VALIDATE_CREDENTIALS_SERVICE_PORT,
      useFactory: (): UserValidateCredentialsServicePort =>
        new UserValidateCredentialsServiceAdapter(),
    },
    {
      provide: CONFIG_SERVICE_PORT,
      useFactory: (
        appConfigEnvService: AppConfigEnvService,
      ): ConfigServicePort => new ConfigServiceAdapter(appConfigEnvService),
      inject: [AppConfigEnvService],
    },
    {
      provide: TOKEN_SERVICE_PORT,
      useFactory: (tokenService: TokenService): TokenServicePort =>
        new TokenServiceAdapter(tokenService),
      inject: [TokenService],
    },
    {
      provide: USER_REPOSITORY_PORT,
      useFactory: (userRepository: IUserRepository): UserRepositoryPort =>
        new UserRepositoryAdapter(userRepository),
      inject: [UserRepository],
    },
    {
      provide: EMAIL_SERVICE_PORT,
      useFactory: (emailQueue: EmailQueue): EmailServicePort =>
        new EmailServiceAdapter(emailQueue),
      inject: [EmailQueue],
    },
    {
      provide: REDIS_SERVICE_PORT,
      useFactory: (redisService: RedisService): RedisServicePort =>
        new RedisServiceAdapter(redisService),
      inject: [RedisService],
    },
    {
      provide: GENERATE_OTP_SERVICE_PORT,
      useFactory: (): GenerateOtpServicePort => new GenerateOtpServiceAdapter(),
    },
    {
      provide: SECURITY_EVENT_PORT,
      useFactory: (eventEmitter: EventEmitter2): SecurityEventPort =>
        new SecurityEventAdapter(eventEmitter),
      inject: [EventEmitter2],
    },
    {
      provide: TEMP_PASSWORD_SERVICE_PORT,
      useClass: TempPasswordServiceAdapter,
    },
    {
      provide: LoginUseCase,
      useFactory: (
        userRepositoryPort: UserRepositoryPort,
        userValidateCredentialsServicePort: UserValidateCredentialsServicePort,
        tokenServicePort: TokenServicePort,
        configServicePort: ConfigServicePort,
        securityEventPort: SecurityEventPort,
        redisServicePort: RedisServicePort,
        emailServicePort: EmailServicePort,
        generateOtpServicePort: GenerateOtpServicePort,
      ) =>
        new LoginUseCase(
          userRepositoryPort,
          userValidateCredentialsServicePort,
          tokenServicePort,
          configServicePort,
          securityEventPort,
          redisServicePort,
          emailServicePort,
          generateOtpServicePort,
        ),
      inject: [
        USER_REPOSITORY_PORT,
        USER_VALIDATE_CREDENTIALS_SERVICE_PORT,
        TOKEN_SERVICE_PORT,
        CONFIG_SERVICE_PORT,
        SECURITY_EVENT_PORT,
        REDIS_SERVICE_PORT,
        EMAIL_SERVICE_PORT,
        GENERATE_OTP_SERVICE_PORT,
      ],
    },
    {
      provide: ActiveAccountUseCase,
      useFactory: (
        tokenServicePort: TokenServicePort,
        userRepositoryPort: UserRepositoryPort,
      ) => new ActiveAccountUseCase(tokenServicePort, userRepositoryPort),
      inject: [TOKEN_SERVICE_PORT, USER_REPOSITORY_PORT],
    },
    {
      provide: ResetPasswordUseCase,
      useFactory: (
        userRepositoryPort: UserRepositoryPort,
        emailServicePort: EmailServicePort,
        redisServicePort: RedisServicePort,
        generateOtpServicePort: GenerateOtpServicePort,
      ) =>
        new ResetPasswordUseCase(
          userRepositoryPort,
          emailServicePort,
          redisServicePort,
          generateOtpServicePort,
        ),
      inject: [
        USER_REPOSITORY_PORT,
        EMAIL_SERVICE_PORT,
        REDIS_SERVICE_PORT,
        GENERATE_OTP_SERVICE_PORT,
      ],
    },
    {
      provide: NewPasswordUseCase,
      useFactory: (
        redisServicePort: RedisServicePort,
        userRepositoryPort: UserRepositoryPort,
        userValidateCredentialsServicePort: UserValidateCredentialsServicePort,
      ) =>
        new NewPasswordUseCase(
          redisServicePort,
          userRepositoryPort,
          userValidateCredentialsServicePort,
        ),
      inject: [
        REDIS_SERVICE_PORT,
        USER_REPOSITORY_PORT,
        USER_VALIDATE_CREDENTIALS_SERVICE_PORT,
      ],
    },
    {
      provide: SendNewTokenToEmailActiveUseCase,
      useFactory: (
        tokenServicePort: TokenServicePort,
        userRepositoryPort: UserRepositoryPort,
        emailServicePort: EmailServicePort,
      ) =>
        new SendNewTokenToEmailActiveUseCase(
          tokenServicePort,
          userRepositoryPort,
          emailServicePort,
        ),
      inject: [TOKEN_SERVICE_PORT, USER_REPOSITORY_PORT, EMAIL_SERVICE_PORT],
    },
    {
      provide: UnblockAccountUseCase,
      useFactory: (
        redisServicePort: RedisServicePort,
        userRepositoryPort: UserRepositoryPort,
        emailServicePort: EmailServicePort,
        tempPasswordServicePort: TempPasswordServicePort,
      ) =>
        new UnblockAccountUseCase(
          redisServicePort,
          userRepositoryPort,
          emailServicePort,
          tempPasswordServicePort,
        ),
      inject: [
        REDIS_SERVICE_PORT,
        USER_REPOSITORY_PORT,
        EMAIL_SERVICE_PORT,
        TEMP_PASSWORD_SERVICE_PORT,
      ],
    },
    AuthGuard,
    JwtService,
  ],
})
export class AuthModule {}
