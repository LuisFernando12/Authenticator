import { BaseUseCase } from '../../../core/application/use-case/base.use-case';
import { OauthAccessToken } from '../../domain/entity/oauth-access-token.entity';
import { OauthDomainError } from '../../domain/error/oauth-domain.error';
import { PkceChallengeValueObject } from '../../domain/value-object/pkce-challenge.value-object';
import { RedirectUriValueObject } from '../../domain/value-object/redirectUri.value-object';
import { OauthTokenDTO } from '../../infrastructure/dto/oauth-authorize.dto';
import { ClientServicePort } from '../port/client-service.port';
import { ConfigServicePort } from '../port/config-service.port';
import { HashedClientSecretServicePort } from '../port/hashed-client-secret.port';
import { RedisServicePort } from '../port/redis-service-port';
import { TokenServicePort } from '../port/token-service.port';
import { ConsentServicePort } from '../port/user-client-consent-service.port';
import { UserServicePort } from '../port/user-service.port';

export interface IExchangeOauthCodeUseCaseResponse {
  token_type: string;
  access_token: string;
  refresh_token: string;
  scope: string;
  expiresAt: string;
}
export interface IExchangeOauthCodeToToken {
  grantType: string;
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
  code: string;
  codeVerifier?: string;
}
export class ExchangeOauthCodeUseCase implements BaseUseCase<
  OauthTokenDTO,
  OauthAccessToken
> {
  constructor(
    private readonly clientServicePort: ClientServicePort,
    private readonly tokenServicePort: TokenServicePort,
    private readonly redisServicePort: RedisServicePort,
    private readonly hashedClientSecretServicePort: HashedClientSecretServicePort,
    private readonly userServicePort: UserServicePort,
    private readonly consentServicePort: ConsentServicePort,
    private readonly configService: ConfigServicePort,
  ) {}
  async execute(payload: IExchangeOauthCodeToToken): Promise<OauthAccessToken> {
    const {
      clientId,
      code,
      clientSecret,
      redirectUri,
      grantType,
      codeVerifier,
    } = payload;
    if (grantType !== 'authorization_code') {
      throw OauthDomainError.invalidGrant(
        `Unsupported grant type ${grantType}`,
      );
    }
    const isPKCE = !!codeVerifier;

    const clientDB = await this.clientServicePort.findByClientId(clientId);
    clientDB.isValidRedirectUri(RedirectUriValueObject.create(redirectUri));

    if (clientDB.isConfidential && !clientSecret) {
      throw OauthDomainError.invalidClient('Client secret is required');
    }

    clientDB.startAuthorizationCodeFlow(isPKCE);
    if (clientDB.isConfidential) {
      await this.hashedClientSecretServicePort.compareHashClientSecret({
        clientSecret,
        clientSecretHashed: clientDB.clientSecret,
        clientSecretPepper: this.configService.clientSecretPepper,
      });
    }
    const codeRedis = await this.redisServicePort.consumeOauthCode(code);
    clientDB.validPkceChallenge(
      PkceChallengeValueObject.create(
        codeRedis.codeChallenge,
        codeRedis.codeChallengeMethod,
      ),
      codeVerifier,
    );
    const userDB = await this.userServicePort.findByEmail(codeRedis.userEmail);
    const consentDB =
      await this.consentServicePort.findConsentByUserIdAndClientId(
        userDB.id,
        clientId,
      );

    const token = await this.tokenServicePort.generateToken(
      {
        sub: userDB.id,
        username: userDB.email,
        scope: codeRedis.scope,
        aud: clientId,
        iss: this.configService.serviceURL,
        type: 'access',
      },
      consentDB.id,
    );
    return token;
  }
}
