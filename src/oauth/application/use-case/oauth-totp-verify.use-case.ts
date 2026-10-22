import { BaseUseCase } from '@/core/application/use-case/base.use-case';
import { GenerateIdServicePort } from '@/oauth/application/port/generate-id-service.port';
import { ConsentServicePort } from '@/oauth/application/port/user-client-consent-service.port';
import { MountUrlValueObject } from '@/oauth/domain/value-object/mount-url.value-object';

import { MFARepositoryPort } from '../../../mfa/application/port/mfa-repository.port';
import { TOTPPort } from '../../../mfa/application/port/totp.port';
import { OauthDomainError } from '../../domain/error/oauth-domain.error';
import { RedisServicePort } from '../port/redis-service-port';
import { UserServicePort } from '../port/user-service.port';
export interface IQueryOauth {
  oauthRequestId: string;
  responseType: string;
  clientId: string;
  redirectUri: string;
  state: string;
  scope: string;
  codeChallenge?: string;
  codeChallengeMethod?: string;
  mfaSchemaId: string;
}
interface ITOTPVerify {
  code: string;
  queryOauth: IQueryOauth;
}
export interface IGenerateTokenResponse {
  access_token: string;
  refresh_token: string;
  expiresAt: string;
}
export class OauthTOTPVerifyUseCase implements BaseUseCase<
  ITOTPVerify,
  IGenerateTokenResponse | URL
> {
  constructor(
    private readonly totpPort: TOTPPort,
    private readonly mfaRepository: MFARepositoryPort,
    private readonly userServicePort: UserServicePort,
    private readonly redisServicePort: RedisServicePort,
    private readonly generateIdServicePort: GenerateIdServicePort,
    private readonly consentServicePort: ConsentServicePort,
  ) {}
  async execute({ code, queryOauth }: ITOTPVerify): Promise<any> {
    const { oauthRequestId, clientId, scope, redirectUri, state, mfaSchemaId } =
      queryOauth;
    const mfaSchema = await this.redisServicePort.consumeMFASchema(mfaSchemaId);
    mfaSchema.validOauthRequestId(oauthRequestId);
    const mfaDB = await this.mfaRepository.findByUserId(mfaSchema.userId);

    if (!mfaDB || mfaDB.every((mfa) => mfa.type !== 'TOTP')) {
      throw OauthDomainError.internalServerError();
    }

    const totp = mfaDB.find((mfa) => mfa.type === 'TOTP').totp;
    this.totpPort.verifyTOTP(code, totp.secret);

    const userDB = await this.userServicePort.findByEmail(mfaSchema.email);
    const oauthRequest =
      await this.redisServicePort.consumeOauthRequest(oauthRequestId);
    oauthRequest.requestMatch(queryOauth);

    const payloadOauthCodeRedis = {
      userEmail: mfaSchema.email,
      codeChallenge: oauthRequest.codeChallenge,
      codeChallengeMethod: oauthRequest.codeChallengeMethod,
      scope: oauthRequest.scope,
    };

    const oauthCode =
      this.generateIdServicePort.generateOauthAuthorizationCode();
    await Promise.all([
      this.redisServicePort.saveOauthAuthorizationCode(
        oauthCode,
        payloadOauthCodeRedis,
      ),
      this.consentServicePort.findOrCreateConsent(userDB.id, clientId, scope),
      this.redisServicePort.deleteMFASchema(mfaSchemaId),
    ]);
    return MountUrlValueObject.mount(redirectUri, { code: oauthCode, state });
  }
}
