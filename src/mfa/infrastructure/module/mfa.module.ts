import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AuthModule } from '../../../auth/infrastructure/module/auth.module';
import { TransactionPort } from '../../../core/application/port/transaction.port';
import { RedisService } from '../../../core/domain/service/redis.service';
import { AuthGuardModule } from '../../../core/infrastructure/module/auth-guard.module';
import { RedisModule } from '../../../core/infrastructure/module/redis.module';
import { TRANSACTION_PORT } from '../../../token/application/port/transaction.port';
import { MFA_REPOSITORY_PORT } from '../../application/port/mfa-repository.port';
import { TOTP_REPOSITORY_PORT } from '../../application/port/totp-repository.port';
import { TOTP_PORT } from '../../application/port/totp.port';
import { TOTPGenerateQrCodeUseCase } from '../../application/user-case/totp-generate-qrCode.use-case';
import { TOTPRegisterUseCase } from '../../application/user-case/totp-register.use-case';
import { TOTPVerifyUseCase } from '../../application/user-case/totp-verify.use-case';
import { TOTPAdapter } from '../adapter/totp.adapter';
import { TransactionAdapter } from '../adapter/transaction.adapter';
import { MFAController } from '../controller/mfa.controller';
import { MFAEntity } from '../persistence/entity/mfa.entity';
import { TOTPEntity } from '../persistence/entity/totp.entity';
import { MFARepositoryImpl } from '../persistence/repository/mfa.repository';
import { TOTPRepositoryImpl } from '../persistence/repository/totp.repository';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([TOTPEntity, MFAEntity]),
    AuthGuardModule,
    RedisModule,
  ],
  providers: [
    { provide: TOTP_REPOSITORY_PORT, useClass: TOTPRepositoryImpl },
    { provide: MFA_REPOSITORY_PORT, useClass: MFARepositoryImpl },
    { provide: TOTP_PORT, useClass: TOTPAdapter },
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
      useFactory: (redisService, totpPort, transactionPort) =>
        new TOTPRegisterUseCase(redisService, totpPort, transactionPort),
      inject: [RedisService, TOTP_PORT, TRANSACTION_PORT],
    },
    {
      provide: TOTPGenerateQrCodeUseCase,
      useFactory: (redisService, totpPort, mfaRepository) =>
        new TOTPGenerateQrCodeUseCase(redisService, totpPort, mfaRepository),
      inject: [RedisService, TOTP_PORT, MFA_REPOSITORY_PORT, TRANSACTION_PORT],
    },
    {
      provide: TOTPVerifyUseCase,
      useFactory: (totpPort, mfaRepository) =>
        new TOTPVerifyUseCase(totpPort, mfaRepository),
      inject: [TOTP_PORT, MFA_REPOSITORY_PORT],
    },
  ],
  controllers: [MFAController],
})
export class MFAModule {}
