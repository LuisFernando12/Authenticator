import { BaseUseCase } from '../../../core/application/use-case/base.use-case';
import { Token } from '../../domain/entity/token.entity';
import { TokenValueObject } from '../../domain/value-object/token.value-object';
import { IGenerateToken } from '../interface/generate-token.interface';
import { ConfigServicePort } from '../port/config-service.port';
import { GenerateJTIPort } from '../port/generate-jti.port';
import { JwtServicePort } from '../port/jwt-service.port';
import { RefreshTokenServicePort } from '../port/refresh-token-service.port';
import { TokenRepositoryPort } from '../port/token-repository.port';
import { TransactionPort } from '../port/transaction.port';

export interface IGenerateTokenPayload {
  payload: IGenerateToken;
  consentId?: string;
}
export interface IGenerateTokenResponse {
  access_token: string;
  refresh_token: string;
  expiresAt: string;
}
export class GenerateTokenUseCase implements BaseUseCase<
  IGenerateTokenPayload,
  IGenerateTokenResponse
> {
  constructor(
    private readonly tokenRepositoryPort: TokenRepositoryPort,
    private readonly configServicePort: ConfigServicePort,
    private readonly jwtServicePort: JwtServicePort,
    private readonly refreshTokenServicePort: RefreshTokenServicePort,
    private readonly generateUUIDPort: GenerateJTIPort,
    private readonly transactionPort: TransactionPort,
  ) {}
  async execute({
    payload,
    consentId,
  }: IGenerateTokenPayload): Promise<IGenerateTokenResponse> {
    const tokenDB = await this.tokenRepositoryPort.findByUserId(payload.sub);
    const expiresAtInMilliseconds = TokenValueObject.generateExpireAt(
      TokenValueObject.getSecondsByDays(
        this.configServicePort.refreshTokenExpiresDays,
      ),
    );
    const expiresAt = new Date(expiresAtInMilliseconds * 1000);
    const jti = this.generateUUIDPort.generate();

    let tokenFamilyId: string;

    if (consentId) {
      tokenFamilyId =
        tokenDB.find((token) => token.consentId === consentId)?.tokenFamilyId ??
        this.generateUUIDPort.generate();
    } else {
      tokenFamilyId = this.generateUUIDPort.generate();
    }
    const token = await this.jwtServicePort.signAsync(
      { ...payload, jti, tokenFamilyId },
      this.configServicePort.accessTokenExpiresIn,
    );

    const refreshToken = this.refreshTokenServicePort.generateRefreshToken();

    const tokenEntity = new Token({
      refreshToken: this.refreshTokenServicePort.hashRefreshToken(refreshToken),
      userId: payload.sub,
      expiresAt: expiresAt,
      consentId: consentId || null,
      tokenFamilyId,
      jti,
    });
    await this.transactionPort.executeTransaction(async (manager) => {
      const sessionDB = consentId
        ? await manager.session.findByUserIdAndConsentId(payload.sub, consentId)
        : await manager.session.findByUserId(payload.sub);
      if (sessionDB.length >= 5) {
        await manager.session.deleteOldestSessionByUserId(
          payload.sub,
          consentId || null,
        );
      }
      return {
        token: await manager.token.create(tokenEntity),
        session: await manager.session.create({
          consentId: consentId || null,
          userId: payload.sub,
          expiresAt: expiresAt,
          tokenFamilyId: tokenFamilyId,
          jti: jti,
        }),
      };
    });
    return {
      access_token: token,
      refresh_token: refreshToken,
      expiresAt: expiresAt.toISOString(),
    };
  }
}
