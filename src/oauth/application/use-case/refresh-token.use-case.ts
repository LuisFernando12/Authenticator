import { BaseUseCase } from '@/core/application/use-case/base.use-case';
import { SecurityEventType } from '../../../security-event/domain/enum/security-event-type.enum';
import { SeverityType } from '../../../security-event/domain/enum/severity-type.enum';
import { OauthAccessToken } from '../../domain/entity/oauth-access-token.entity';
import { OauthDomainError } from '../../domain/error/oauth-domain.error';
import { ConfigServicePort } from '../port/config-service.port';
import { RedisServicePort } from '../port/redis-service-port';
import { SecurityEventPort } from '../port/security-event.port';
import { IPayloadToken, TokenServicePort } from '../port/token-service.port';
import { ConsentServicePort } from '../port/user-client-consent-service.port';
import { UserServicePort } from '../port/user-service.port';
interface IRefreshTokenUseCasePayload {
  grantType: string;
  refreshToken: string;
  ip: string;
  userAgent: string;
}
export class RefreshTokenUseCase implements BaseUseCase<
  IRefreshTokenUseCasePayload,
  OauthAccessToken
> {
  constructor(
    private readonly tokenServicePort: TokenServicePort,
    private readonly userServicePort: UserServicePort,
    private readonly consentServicePort: ConsentServicePort,
    private readonly configServicePort: ConfigServicePort,
    private readonly redisServicePort: RedisServicePort,
    private readonly securityEventPort: SecurityEventPort,
  ) {}
  async execute(
    payload: IRefreshTokenUseCasePayload,
  ): Promise<OauthAccessToken> {
    const { refreshToken, grantType } = payload;
    if (grantType !== 'refresh_token') {
      throw OauthDomainError.invalidGrant(
        `Invalid grant type: ${payload.grantType}`,
      );
    }
    const refreshTokenHashed =
      this.tokenServicePort.hashRefreshToken(refreshToken);
    const refreshTokenIsReused =
      await this.redisServicePort.consultHasTokenFamilyOnReuseDetection(
        refreshTokenHashed,
      );
    if (refreshTokenIsReused?.tokenFamilyId) {
      await this.tokenServicePort.deleteByTokenFamilyId(
        refreshTokenIsReused.tokenFamilyId,
      );
      this.securityEventPort.emit({
        ip: payload.ip,
        userAgent: payload.userAgent,
        severity: SeverityType.HIGH,
        type: SecurityEventType.REFRESH_TOKEN_REUSED,
        email: refreshTokenIsReused.email,
      });
      throw OauthDomainError.tokenFamilyReused();
    }
    const refreshTokenDB =
      await this.tokenServicePort.findByRefreshToken(refreshTokenHashed);
    refreshTokenDB.validateRefreshTokenIsValid();
    const { email } = refreshTokenDB.user;
    const userDB = await this.userServicePort.findByEmail(email);
    const { id: userId } = userDB;
    const consentDB = await this.consentServicePort.findByConsentId(
      refreshTokenDB.consentId,
    );
    const { scopes, clientId, id: consentId } = consentDB;
    const payloadToken: IPayloadToken = {
      sub: userId,
      username: email,
      scope: scopes.join(' '),
      aud: clientId,
      iss: this.configServicePort.serviceURL,
      type: 'access',
    };
    await this.redisServicePort.addTokenFamilyToReuseDetection({
      tokenFamilyId: refreshTokenDB.tokenFamilyId,
      jti: refreshTokenDB.jti,
      expiresAt: refreshTokenDB.expiresAt,
      refreshToken: refreshTokenDB.refreshToken,
      email,
    });
    return await this.tokenServicePort.refreshToken(
      payloadToken,
      refreshTokenHashed,
      consentId,
    );
  }
}
