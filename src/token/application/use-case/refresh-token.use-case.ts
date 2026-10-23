import { BaseUseCase } from '../../../core/application/use-case/base.use-case';
import { TokenDomainError } from '../../domain/error/token-domain.error';
import { TokenValueObject } from '../../domain/value-object/token.value-object';
import { IGenerateToken } from '../interface/generate-token.interface';
import { ConfigServicePort } from '../port/config-service.port';
import { GenerateJTIPort } from '../port/generate-jti.port';
import { JwtServicePort } from '../port/jwt-service.port';
import { RefreshTokenServicePort } from '../port/refresh-token-service.port';
import { TokenRepositoryPort } from '../port/token-repository.port';
import { TransactionPort } from '../port/transaction.port';

export interface IRefreshTokenPayload {
  payload: Omit<IGenerateToken, 'type'>;
  oldRefreshToken: string;
}
export interface IRefreshTokenUseCaseResponse {
  access_token: string;
  refresh_token: string;
  expiresAt: string;
}
export class RefreshTokenUseCase implements BaseUseCase<
  IRefreshTokenPayload,
  IRefreshTokenUseCaseResponse
> {
  constructor(
    private readonly tokenRepositoryPort: TokenRepositoryPort,
    private readonly configServicePort: ConfigServicePort,
    private readonly jwtServicePort: JwtServicePort,
    private readonly refreshTokenServicePort: RefreshTokenServicePort,
    private readonly generateJtiPort: GenerateJTIPort,
    private readonly transactionPort: TransactionPort,
  ) {}
  async execute({
    payload,
    oldRefreshToken,
  }: IRefreshTokenPayload): Promise<any> {
    const tokenDB = await this.tokenRepositoryPort.findByUserId(payload.sub);
    const refreshTokenDB = tokenDB.find(
      (item) => item.refreshToken === oldRefreshToken,
    );
    if (!refreshTokenDB) {
      throw TokenDomainError.unauthorized('Invalid refresh token');
    }
    const refreshToken = this.refreshTokenServicePort.generateRefreshToken();
    const refreshTokenHashed =
      this.refreshTokenServicePort.hashRefreshToken(refreshToken);
    const jti = this.generateJtiPort.generate();
    const tokenFamilyId = refreshTokenDB.tokenFamilyId;
    const expiresAtInMilliseconds = TokenValueObject.generateExpireAt(
      TokenValueObject.getSecondsByDays(
        this.configServicePort.refreshTokenExpiresDays,
      ),
    );
    const expiresAt = new Date(expiresAtInMilliseconds * 1000);
    const newAccessToken = await this.jwtServicePort.signAsync(
      { ...payload, jti, tokenFamilyId },
      this.configServicePort.accessTokenExpiresIn,
    );
    const oldJti = refreshTokenDB.jti;
    refreshTokenDB.refreshTokenUpdate(refreshTokenHashed, jti, expiresAt);
    await this.transactionPort.executeTransaction(
      async (transactionManager) => {
        await transactionManager.token.update({
          id: refreshTokenDB.id,
          token: refreshTokenDB,
        });
        await transactionManager.session.update(
          {
            newJTI: jti,
            expiresAt: expiresAt,
          },
          oldJti,
        );
      },
    );
    return {
      access_token: newAccessToken,
      refresh_token: refreshToken,
      expiresAt: expiresAt.toISOString(),
    };
  }
}
