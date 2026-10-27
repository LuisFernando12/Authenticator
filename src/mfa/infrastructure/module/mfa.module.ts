import {
  USER_REPOSITORY_PORT,
  UserRepositoryPort,
} from '@/core/application/port/user-repository.port';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { TransactionPort } from '../../../core/application/port/transaction.port';
import {
  REDIS_SERVICE_PORT,
  RedisService,
} from '../../../core/domain/service/redis.service';
import { AuthGuardModule } from '../../../core/infrastructure/module/auth-guard.module';
import { RedisModule } from '../../../core/infrastructure/module/redis.module';
import { TRANSACTION_PORT } from '../../../token/application/port/transaction.port';
import { TokenService } from '../../../token/application/service/token.service';
import { TokenModule } from '../../../token/infrastructure/module/token.module';
import {
  MFA_REPOSITORY_PORT,
  MFARepositoryPort,
} from '../../application/port/mfa-repository.port';
import {
  TOKEN_SERVICE_PORT,
  TokenServicePort,
} from '../../application/port/token-service.port';
import {
  TOTP_REPOSITORY_PORT,
  TOTPRepositoryPort,
} from '../../application/port/totp-repository.port';
import { TOTP_PORT, TOTPPort } from '../../application/port/totp.port';
import { TOTPGenerateQrCodeUseCase } from '../../application/use-case/totp-generate-qrCode.use-case';
import { TOTPRegisterUseCase } from '../../application/use-case/totp-register.use-case';
import { TOTPVerifyUseCase } from '../../application/use-case/totp-verify.use-case';
import { TokenServiceAdapter } from '../adapter/token-service.adapter';
import { TOTPAdapter } from '../adapter/totp.adapter';
import { TransactionAdapter } from '../adapter/transaction.adapter';
import { MFAController } from '../controller/mfa.controller';
import { MFAEntity } from '../persistence/entity/mfa.entity';
import { TOTPEntity } from '../persistence/entity/totp.entity';
import { MFARepositoryImpl } from '../persistence/repository/mfa.repository';
import { TOTPRepositoryImpl } from '../persistence/repository/totp.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([TOTPEntity, MFAEntity]),
    AuthGuardModule,
    RedisModule,
    TokenModule,
  ],
  providers: [
    { provide: TOTP_REPOSITORY_PORT, useClass: TOTPRepositoryImpl },
    { provide: MFA_REPOSITORY_PORT, useClass: MFARepositoryImpl },
    { provide: TOTP_PORT, useClass: TOTPAdapter },
    {
      provide: TOKEN_SERVICE_PORT,
      useFactory: (tokenService: TokenService) =>
        new TokenServiceAdapter(tokenService),
      inject: [TokenService],
    },
    {
      provide: TRANSACTION_PORT,
      useFactory: (
        dataSource: DataSource,
      ): TransactionPort<MFARepositoryImpl, TOTPRepositoryImpl> =>
        new TransactionAdapter(dataSource),
      inject: [DataSource],
    },
    {
      provide: TOTPRegisterUseCase,
      useFactory: (
        redisService: RedisService,
        totpPort: TOTPPort,
        transactionPort: TransactionPort<MFARepositoryPort, TOTPRepositoryPort>,
      ) => new TOTPRegisterUseCase(redisService, totpPort, transactionPort),
      inject: [REDIS_SERVICE_PORT, TOTP_PORT, TRANSACTION_PORT],
    },
    {
      provide: TOTPGenerateQrCodeUseCase,
      useFactory: (
        redisService: RedisService,
        totpPort: TOTPPort,
        mfaRepository: MFARepositoryPort,
      ) => new TOTPGenerateQrCodeUseCase(redisService, totpPort, mfaRepository),
      inject: [
        REDIS_SERVICE_PORT,
        TOTP_PORT,
        MFA_REPOSITORY_PORT,
        TRANSACTION_PORT,
      ],
    },
    {
      provide: TOTPVerifyUseCase,
      useFactory: (
        totpPort: TOTPPort,
        mfaRepository: MFARepositoryPort,
        tokenServicePort: TokenServicePort,
        userRepositoryPort: UserRepositoryPort,
        redisService: RedisService,
      ) =>
        new TOTPVerifyUseCase(
          totpPort,
          mfaRepository,
          tokenServicePort,
          userRepositoryPort,
          redisService,
        ),
      inject: [
        TOTP_PORT,
        MFA_REPOSITORY_PORT,
        TOKEN_SERVICE_PORT,
        USER_REPOSITORY_PORT,
        REDIS_SERVICE_PORT,
      ],
    },
  ],
  controllers: [MFAController],
  exports: [MFA_REPOSITORY_PORT, TOTP_PORT],
})
export class MFAModule {}
