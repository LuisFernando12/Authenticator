import { AppConfigEnvService } from '@/core/domain/service/app-config-env.service';
import { TokenEntity } from '@/token/infrastructure/persistence/entity/token.entity';
import { TokenRepository } from '@/token/infrastructure/persistence/repository/token.repository';
import { Module } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AppConfigModule } from '../../../core/infrastructure/module/app-config.module';
import { SessionModule } from '../../../session/infrastructure/module/session.module';
import {
  CONFIG_SERVICE_PORT,
  ConfigServicePort,
} from '../../application/port/config-service.port';
import {
  GENERATE_JTI_PORT,
  GenerateUUIDPort,
} from '../../application/port/generate-uuid.port';
import {
  JWT_SERVICE_PORT,
  JwtServicePort,
} from '../../application/port/jwt-service.port';
import {
  REFRESH_TOKEN_SERVICE_PORT,
  RefreshTokenServicePort,
} from '../../application/port/refresh-token-service.port';
import {
  TOKEN_REPOSITORY_PORT,
  TokenRepositoryPort,
} from '../../application/port/token-repository.port';
import {
  TRANSACTION_PORT,
  TransactionPort,
} from '../../application/port/transaction.port';
import {
  TokenService,
  TokenServiceImpls,
} from '../../application/service/token.service';
import { DeleteByTokenFamilyIdUseCase } from '../../application/use-case/delete-by-token-family-id.use-case';
import { FindByRefreshTokenUseCase } from '../../application/use-case/find-by-refresh-token.use-case';
import { FindByTokenFamilyIdUseCase } from '../../application/use-case/find-by-token-family-id.use-case';
import { GenerateEmailVerificationTokenUseCase } from '../../application/use-case/generate-email-verification-token.use-case';
import { GenerateMFATokenUseCase } from '../../application/use-case/generate-mfa-token.use-case';
import { GenerateTokenUseCase } from '../../application/use-case/generate-token.use-case';
import { RefreshTokenUseCase } from '../../application/use-case/refresh-token.use-case';
import { RevokeTokenUseCase } from '../../application/use-case/revoke-token.use-case';
import { TokenIntrospectUseCase } from '../../application/use-case/token-introspect.use-case';
import { ConfigServiceAdapter } from '../adapter/config-service.adapter';
import { GenerateUUIDAdapter } from '../adapter/generate-uuid.adapter';
import { JwtServiceAdapter } from '../adapter/jwt-service.adapter';
import { RefreshTokenServiceAdapter } from '../adapter/refresh-token-service.adapter';
import { TokenRepositoryAdapter } from '../adapter/token-repository.adapter';
import { TransactionAdapter } from '../adapter/transaction.adapter';
import { VerifyTokenUseCase } from './../../application/use-case/verify-token.use-case';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [AppConfigModule],
      inject: [AppConfigEnvService],
      useFactory: (config: AppConfigEnvService) => ({
        global: true,
        secret: config.secret,
        signOptions: {
          expiresIn: '60s',
        },
      }),
    }),
    TypeOrmModule.forFeature([TokenEntity]),
    SessionModule,
  ],
  providers: [
    TokenRepository,
    {
      provide: CONFIG_SERVICE_PORT,
      useFactory: (configService: AppConfigEnvService): ConfigServicePort =>
        new ConfigServiceAdapter(configService),
      inject: [AppConfigEnvService],
    },
    {
      provide: TRANSACTION_PORT,
      useFactory: (dataSource: DataSource): TransactionPort =>
        new TransactionAdapter(dataSource),
      inject: [DataSource],
    },
    {
      provide: GENERATE_JTI_PORT,
      useFactory: (): GenerateUUIDPort => new GenerateUUIDAdapter(),
    },
    {
      provide: REFRESH_TOKEN_SERVICE_PORT,
      useFactory: (): RefreshTokenServicePort =>
        new RefreshTokenServiceAdapter(),
    },
    {
      provide: TOKEN_REPOSITORY_PORT,
      useFactory: (tokenRepository: TokenRepository): TokenRepositoryPort =>
        new TokenRepositoryAdapter(tokenRepository),
      inject: [TokenRepository],
    },
    {
      provide: JWT_SERVICE_PORT,
      useFactory: (
        jwtService: JwtService,
        appConfigEnvService: AppConfigEnvService,
      ): JwtServicePort =>
        new JwtServiceAdapter(jwtService, appConfigEnvService),
      inject: [JwtService, AppConfigEnvService],
    },
    {
      provide: FindByRefreshTokenUseCase,
      useFactory: (tokenRepositoryPort: TokenRepositoryPort) =>
        new FindByRefreshTokenUseCase(tokenRepositoryPort),
      inject: [TOKEN_REPOSITORY_PORT],
    },
    {
      provide: GenerateEmailVerificationTokenUseCase,
      useFactory: (
        jwtServicePort: JwtServicePort,
        configServicePort: ConfigServicePort,
      ) =>
        new GenerateEmailVerificationTokenUseCase(
          jwtServicePort,
          configServicePort,
        ),
      inject: [JWT_SERVICE_PORT, CONFIG_SERVICE_PORT],
    },
    {
      provide: RevokeTokenUseCase,
      useFactory: (transactionPort: TransactionPort) =>
        new RevokeTokenUseCase(transactionPort),
      inject: [TRANSACTION_PORT],
    },
    {
      provide: TokenIntrospectUseCase,
      useFactory: (verifyTokenUseCase: VerifyTokenUseCase) =>
        new TokenIntrospectUseCase(verifyTokenUseCase),
      inject: [VerifyTokenUseCase],
    },
    {
      provide: VerifyTokenUseCase,
      useFactory: (jwtServicePort: JwtServicePort) =>
        new VerifyTokenUseCase(jwtServicePort),
      inject: [JWT_SERVICE_PORT],
    },
    {
      provide: GenerateTokenUseCase,
      useFactory: (
        tokenRepositoryPort: TokenRepositoryPort,
        configServicePort: ConfigServicePort,
        jwtServicePort: JwtServicePort,
        generateTokensServicePort: RefreshTokenServicePort,
        generateJtiPort: GenerateUUIDPort,
        transactionPort: TransactionPort,
      ) =>
        new GenerateTokenUseCase(
          tokenRepositoryPort,
          configServicePort,
          jwtServicePort,
          generateTokensServicePort,
          generateJtiPort,
          transactionPort,
        ),
      inject: [
        TOKEN_REPOSITORY_PORT,
        CONFIG_SERVICE_PORT,
        JWT_SERVICE_PORT,
        REFRESH_TOKEN_SERVICE_PORT,
        GENERATE_JTI_PORT,
        TRANSACTION_PORT,
      ],
    },
    {
      provide: GenerateMFATokenUseCase,
      useFactory: (jwtServicePort: JwtServicePort) =>
        new GenerateMFATokenUseCase(jwtServicePort),
      inject: [JWT_SERVICE_PORT],
    },
    {
      provide: RefreshTokenUseCase,
      useFactory: (
        tokenRepositoryPort: TokenRepositoryPort,
        configServicePort: ConfigServicePort,
        jwtServicePort: JwtServicePort,
        refreshTokenServicePort: RefreshTokenServicePort,
        generateJtiPort: GenerateUUIDPort,
        transactionPort: TransactionPort,
      ) =>
        new RefreshTokenUseCase(
          tokenRepositoryPort,
          configServicePort,
          jwtServicePort,
          refreshTokenServicePort,
          generateJtiPort,
          transactionPort,
        ),
      inject: [
        TOKEN_REPOSITORY_PORT,
        CONFIG_SERVICE_PORT,
        JWT_SERVICE_PORT,
        REFRESH_TOKEN_SERVICE_PORT,
        GENERATE_JTI_PORT,
        TRANSACTION_PORT,
      ],
    },
    {
      provide: FindByTokenFamilyIdUseCase,
      useFactory: (tokenRepositoryPort: TokenRepositoryPort) =>
        new FindByTokenFamilyIdUseCase(tokenRepositoryPort),
      inject: [TOKEN_REPOSITORY_PORT],
    },
    {
      provide: DeleteByTokenFamilyIdUseCase,
      useFactory: (transactionPort: TransactionPort) =>
        new DeleteByTokenFamilyIdUseCase(transactionPort),
      inject: [TRANSACTION_PORT],
    },
    {
      provide: TokenService,
      useFactory: (
        generateTokenUseCase: GenerateTokenUseCase,
        generateMFATokenUseCase: GenerateMFATokenUseCase,
        refreshTokenUseCase: RefreshTokenUseCase,
        revokeTokenUseCase: RevokeTokenUseCase,
        tokenIntrospectUseCase: TokenIntrospectUseCase,
        verifyTokenUseCase: VerifyTokenUseCase,
        findByRefreshTokenUseCase: FindByRefreshTokenUseCase,
        generateEmailVerificationTokenUseCase: GenerateEmailVerificationTokenUseCase,
        findByTokenFamilyIdUseCase: FindByTokenFamilyIdUseCase,
        deleteByTokenFamilyIdUseCase: DeleteByTokenFamilyIdUseCase,
      ): TokenService =>
        new TokenServiceImpls(
          generateTokenUseCase,
          generateMFATokenUseCase,
          refreshTokenUseCase,
          revokeTokenUseCase,
          tokenIntrospectUseCase,
          verifyTokenUseCase,
          findByRefreshTokenUseCase,
          generateEmailVerificationTokenUseCase,
          findByTokenFamilyIdUseCase,
          deleteByTokenFamilyIdUseCase,
        ),
      inject: [
        GenerateTokenUseCase,
        GenerateMFATokenUseCase,
        RefreshTokenUseCase,
        RevokeTokenUseCase,
        TokenIntrospectUseCase,
        VerifyTokenUseCase,
        FindByRefreshTokenUseCase,
        GenerateEmailVerificationTokenUseCase,
        FindByTokenFamilyIdUseCase,
        DeleteByTokenFamilyIdUseCase,
      ],
    },
  ],
  exports: [TokenService, TokenRepository],
})
export class TokenModule {}
