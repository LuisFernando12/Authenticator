import { ClientModule } from '@/client/infrastructure/module/client.module';
import { RedisService } from '@/core/domain/service/redis.service';
import { AppConfigModule } from '@/core/infrastructure/module/app-config.module';
import { OauthController } from '@/oauth/infrastructure/controller/oauth.controller';
import { TokenModule } from '@/token/infrastructure/module/token.module';
import { UserModule } from '@/user/infrastructure/module/user.module';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfigEnvService } from '../../../core/domain/service/app-config-env.service';
import { RedisServiceImplement } from '../../../core/infrastructure/service/redis.service';
import {
  CLIENT_SERVICE_PORT,
  ClientServicePort,
} from '../../application/port/client-service.port';
import {
  CONFIG_SERVICE_PORT,
  ConfigServicePort,
} from '../../application/port/config-service.port';
import {
  HASHED_CLIENT_SECRET_SERVICE_PORT,
  HashedClientSecretServicePort,
} from '../../application/port/hashed-client-secret.port';
import {
  REDIS_SERVICE_PORT,
  RedisServicePort,
} from '../../application/port/redis-service-port';
import {
  TOKEN_SERVICE_PORT,
  TokenServicePort,
} from '../../application/port/token-service.port';
import {
  CONSENT_SERVICE_PORT,
  ConsentServicePort,
} from '../../application/port/user-client-consent-service.port';
import {
  USER_SERVICE_PORT,
  UserServicePort,
} from '../../application/port/user-service.port';
import { AuthorizeUseCase } from '../../application/use-case/authorize.use-case';
import { ExchangeOauthCodeUseCase } from '../../application/use-case/exchange-auth-code.use-case';
import { LoginUseCase } from '../../application/use-case/login.use-case';
import { RefreshTokenUseCase } from '../../application/use-case/refresh-token.use-case';
import { RevokeTokenUseCase } from '../../application/use-case/revoke-token.use-case';
import { TokenIntrospectUseCase } from '../../application/use-case/token-introspect.use-case';

import {
  MFA_REPOSITORY_PORT,
  MFARepositoryPort,
} from '@/mfa/application/port/mfa-repository.port';
import {
  IUserRepository,
  UserRepository,
} from '@/user/infrastructure/persistence/repository/user.repository';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  ClientRepository,
  IClientRepository,
} from '../../../client/infrastructure/repository/client.repository';
import { ConsentService } from '../../../consent/application/service/consent.service';
import { ConsentModule } from '../../../consent/infrastructure/module/consent.module';
import { EmailModule } from '../../../email/infrastructure/module/email.module';
import { EmailQueue } from '../../../email/infrastructure/queue/email.queue';
import { TOTP_PORT, TOTPPort } from '../../../mfa/application/port/totp.port';
import { MFAModule } from '../../../mfa/infrastructure/module/mfa.module';
import { TokenService } from '../../../token/application/service/token.service';
import {
  EMAIL_SERVICE_PORT,
  EmailServicePort,
} from '../../application/port/email-service.port';
import {
  GENERATE_ID_SERVICE_PORT,
  GenerateIdServicePort,
} from '../../application/port/generate-id-service.port';
import {
  GENERATE_OTP_SERVICE_PORT,
  GenerateOtpServicePort,
} from '../../application/port/generate-otp-service.port';
import {
  SECURITY_EVENT_PORT,
  SecurityEventPort,
} from '../../application/port/security-event.port';
import { OauthTOTPVerifyUseCase } from '../../application/use-case/oauth-totp-verify.use-case';
import { ClientServiceAdapter } from '../adapter/client-service.adapter';
import { ConfigServiceAdapter } from '../adapter/config-service.adapter';
import { ConsentServiceAdapter } from '../adapter/consent-service.adapter';
import { EmailServiceAdapter } from '../adapter/email-service.port';
import { GenerateIdServiceAdapter } from '../adapter/generate-id-service.adapter';
import { GenerateOtpServiceAdapter } from '../adapter/generate-otp-service.adapter';
import { HashedClientSecretServiceAdapter } from '../adapter/hashed-client-secret-service.adapter';
import { RedisServiceAdapter } from '../adapter/redis-service.adapter';
import { SecurityEventAdapter } from '../adapter/security-event.adapter';
import { TokenServiceAdapter } from '../adapter/token-service.adapter';
import { UserServiceAdapter } from '../adapter/user-service.adapter';

@Module({
  imports: [
    ClientModule,
    UserModule,
    TokenModule,
    ConsentModule,
    AppConfigModule,
    EmailModule,
    MFAModule,
  ],
  controllers: [OauthController],
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
      provide: CLIENT_SERVICE_PORT,
      useFactory: (clientRepository: IClientRepository): ClientServicePort =>
        new ClientServiceAdapter(clientRepository),
      inject: [ClientRepository],
    },
    {
      provide: CONSENT_SERVICE_PORT,
      useFactory: (userClientConsentService: ConsentService) =>
        new ConsentServiceAdapter(userClientConsentService),
      inject: [ConsentService],
    },
    {
      provide: TOKEN_SERVICE_PORT,
      useFactory: (tokenService: TokenService): TokenServicePort =>
        new TokenServiceAdapter(tokenService),
      inject: [TokenService],
    },
    {
      provide: REDIS_SERVICE_PORT,
      useFactory: (redisService: RedisService): RedisServicePort =>
        new RedisServiceAdapter(redisService),
      inject: [RedisService],
    },
    {
      provide: HASHED_CLIENT_SECRET_SERVICE_PORT,
      useFactory: (): HashedClientSecretServicePort =>
        new HashedClientSecretServiceAdapter(),
    },
    {
      provide: USER_SERVICE_PORT,
      useFactory: (userRepository: IUserRepository): UserServicePort =>
        new UserServiceAdapter(userRepository),
      inject: [UserRepository],
    },
    {
      provide: CONFIG_SERVICE_PORT,
      useFactory: (configService: AppConfigEnvService): ConfigServicePort =>
        new ConfigServiceAdapter(configService),
      inject: [AppConfigEnvService],
    },
    {
      provide: GENERATE_ID_SERVICE_PORT,
      useFactory: (): GenerateIdServicePort => new GenerateIdServiceAdapter(),
    },
    {
      provide: SECURITY_EVENT_PORT,
      useFactory: (eventEmitter: EventEmitter2): SecurityEventPort =>
        new SecurityEventAdapter(eventEmitter),
      inject: [EventEmitter2],
    },
    {
      provide: EMAIL_SERVICE_PORT,
      useFactory: (emailQueue: EmailQueue): EmailServicePort =>
        new EmailServiceAdapter(emailQueue),
      inject: [EmailQueue],
    },
    {
      provide: GENERATE_OTP_SERVICE_PORT,
      useFactory: (): GenerateOtpServicePort => new GenerateOtpServiceAdapter(),
    },
    {
      provide: AuthorizeUseCase,
      useFactory: (
        clientServicePort: ClientServicePort,
        generateIdServicePort: GenerateIdServicePort,
        redisServicePort: RedisServicePort,
        configServicePort: ConfigServicePort,
      ) => {
        return new AuthorizeUseCase(
          clientServicePort,
          generateIdServicePort,
          redisServicePort,
          configServicePort,
        );
      },
      inject: [
        CLIENT_SERVICE_PORT,
        GENERATE_ID_SERVICE_PORT,
        REDIS_SERVICE_PORT,
        CONFIG_SERVICE_PORT,
      ],
    },
    {
      provide: ExchangeOauthCodeUseCase,
      useFactory: (
        clientServicePort: ClientServicePort,
        tokenServicePort: TokenServicePort,
        redisServicePort: RedisServicePort,
        hashedClientSecretServicePort: HashedClientSecretServicePort,
        userServicePort: UserServicePort,
        userClientConsentServicePort: ConsentServicePort,
        configService: ConfigServicePort,
      ) => {
        return new ExchangeOauthCodeUseCase(
          clientServicePort,
          tokenServicePort,
          redisServicePort,
          hashedClientSecretServicePort,
          userServicePort,
          userClientConsentServicePort,
          configService,
        );
      },
      inject: [
        CLIENT_SERVICE_PORT,
        TOKEN_SERVICE_PORT,
        REDIS_SERVICE_PORT,
        HASHED_CLIENT_SECRET_SERVICE_PORT,
        USER_SERVICE_PORT,
        CONSENT_SERVICE_PORT,
        CONFIG_SERVICE_PORT,
      ],
    },
    {
      provide: OauthTOTPVerifyUseCase,
      useFactory: (
        totpPort: TOTPPort,
        mfaRepository: MFARepositoryPort,
        userServicePort: UserServicePort,
        redisServicePort: RedisServicePort,
        generateIdServicePort: GenerateIdServicePort,
        consentServicePort: ConsentServicePort,
      ) =>
        new OauthTOTPVerifyUseCase(
          totpPort,
          mfaRepository,
          userServicePort,
          redisServicePort,
          generateIdServicePort,
          consentServicePort,
        ),
      inject: [
        TOTP_PORT,
        MFA_REPOSITORY_PORT,
        USER_SERVICE_PORT,
        REDIS_SERVICE_PORT,
        GENERATE_ID_SERVICE_PORT,
        CONSENT_SERVICE_PORT,
      ],
    },
    {
      provide: LoginUseCase,
      useFactory: (
        redisServicePort: RedisServicePort,
        userServicePort: UserServicePort,
        userClientConsentServicePort: ConsentServicePort,
        generateIdServicePort: GenerateIdServicePort,
        securityEventPort: SecurityEventPort,
        generateOtpServicePort: GenerateOtpServicePort,
        emailServicePort: EmailServicePort,
        mfaRepositoryPort: MFARepositoryPort,
      ) => {
        return new LoginUseCase(
          redisServicePort,
          userServicePort,
          userClientConsentServicePort,
          generateIdServicePort,
          securityEventPort,
          generateOtpServicePort,
          emailServicePort,
          mfaRepositoryPort,
        );
      },
      inject: [
        REDIS_SERVICE_PORT,
        USER_SERVICE_PORT,
        CONSENT_SERVICE_PORT,
        GENERATE_ID_SERVICE_PORT,
        SECURITY_EVENT_PORT,
        GENERATE_OTP_SERVICE_PORT,
        EMAIL_SERVICE_PORT,
        MFA_REPOSITORY_PORT,
      ],
    },
    {
      provide: RefreshTokenUseCase,
      useFactory: (
        tokenServicePort: TokenServicePort,
        userServicePort: UserServicePort,
        userClientConsentServicePort: ConsentServicePort,
        configServicePort: ConfigServicePort,
        redisServicePort: RedisServicePort,
        securityEventPort: SecurityEventPort,
      ) =>
        new RefreshTokenUseCase(
          tokenServicePort,
          userServicePort,
          userClientConsentServicePort,
          configServicePort,
          redisServicePort,
          securityEventPort,
        ),
      inject: [
        TOKEN_SERVICE_PORT,
        USER_SERVICE_PORT,
        CONSENT_SERVICE_PORT,
        CONFIG_SERVICE_PORT,
        REDIS_SERVICE_PORT,
        SECURITY_EVENT_PORT,
      ],
    },
    {
      provide: RevokeTokenUseCase,
      useFactory: (
        tokenServicePort: TokenServicePort,
        redisServicePort: RedisServicePort,
      ) => new RevokeTokenUseCase(tokenServicePort, redisServicePort),
      inject: [TOKEN_SERVICE_PORT, REDIS_SERVICE_PORT],
    },
    {
      provide: TokenIntrospectUseCase,
      useFactory: (
        tokenServicePort: TokenServicePort,
        redisServicePort: RedisServicePort,
      ) => new TokenIntrospectUseCase(tokenServicePort, redisServicePort),
      inject: [TOKEN_SERVICE_PORT, REDIS_SERVICE_PORT],
    },
  ],
})
export class OauthModule {}
