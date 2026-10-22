import { RedisService } from '../../../core/domain/service/redis.service';
import {
  IOauthRequestCodePayload,
  ITokenFamilyRevoked,
  RedisServicePort,
} from '../../application/port/redis-service-port';
import { OauthRequest } from '../../domain/entity/oauth-request.entity';
import { OauthDomainError } from '../../domain/error/oauth-domain.error';
import { MFASchemaValueObject } from '../../domain/value-object/mfa-schema.value-object';

export class RedisServiceAdapter implements RedisServicePort {
  constructor(private readonly redisService: RedisService) {}
  async saveAuthRequest(authRequest: OauthRequest): Promise<string> {
    const saveAuthRequestOnRedis = await this.redisService.setOnRedis(
      `oauth:authorize:request:${authRequest.oauthRequestId}`,
      authRequest.stringify(),
      300,
    );
    if (!saveAuthRequestOnRedis) {
      throw OauthDomainError.invalidGrant(
        'Failure to save authRequest on redis!',
      );
    }
    return saveAuthRequestOnRedis;
  }
  async consumeOauthRequest(oauthRequestId: string): Promise<OauthRequest> {
    const payloadAuthRequest = await this.redisService.getAndDeleteOnRedis(
      `oauth:authorize:request:${oauthRequestId}`,
    );
    if (!payloadAuthRequest) {
      throw OauthDomainError.invalidGrant('Oauth Request ID not found');
    }
    return OauthRequest.parseJSON(payloadAuthRequest);
  }
  async consumeOauthCode(key: string): Promise<any> {
    const codeRedis = JSON.parse(
      await this.redisService.getAndDeleteOnRedis(`oauth-code-${key}`),
    );
    if (!codeRedis) {
      throw OauthDomainError.invalidClient('Authorization code expired');
    }
    return codeRedis;
  }
  async saveOauthAuthorizationCode(
    code: string,
    payloadOauthCodeRedis: IOauthRequestCodePayload,
  ): Promise<string> {
    const saveCodeRedis = await this.redisService.setOnRedis(
      `oauth-code-${code}`,
      JSON.stringify(payloadOauthCodeRedis),
      300,
    );
    if (!saveCodeRedis) {
      throw OauthDomainError.internalServerError(
        'Failure to save code on redis',
      );
    }
    return saveCodeRedis;
  }
  async addJtiTokenOnBlockList(jti: string): Promise<string> {
    const revokeTokenBlocklist = await this.redisService.setOnRedis(
      `revoke-token-blocklist:${jti}`,
      jti,
      900,
    );
    if (revokeTokenBlocklist !== 'OK') {
      throw OauthDomainError.internalServerError(
        'Failure to save token like blocked on redis !',
      );
    }
    return revokeTokenBlocklist;
  }
  async consultHasJtiTokenOnBlockList(jti: string): Promise<boolean> {
    const tokenIsBlocked = await this.redisService.getOnRedis(
      `revoke-token-blocklist:${jti}`,
    );
    return !!tokenIsBlocked;
  }
  async addTokenFamilyToReuseDetection(
    payloadTokenFamily: ITokenFamilyRevoked,
  ): Promise<string> {
    const usedRefreshTokenList = await this.redisService.setOnRedis(
      `token-family-used:${payloadTokenFamily.refreshToken}`,
      JSON.stringify(payloadTokenFamily),
      Math.floor((payloadTokenFamily.expiresAt.getTime() - Date.now()) / 1000),
    );
    if (usedRefreshTokenList !== 'OK') {
      throw OauthDomainError.internalServerError(
        'Failure to save token like blocked on redis !',
      );
    }
    return usedRefreshTokenList;
  }
  async consultHasTokenFamilyOnReuseDetection(
    refreshToken: string,
  ): Promise<ITokenFamilyRevoked> {
    const tokenIsBlocked = await this.redisService.getOnRedis(
      `token-family-used:${refreshToken}`,
    );
    return JSON.parse(tokenIsBlocked) || false;
  }
  async setFailedLoginAttempt(email: string): Promise<void> {
    const failedLoginAttempt = await this.getFailedLoginAttempt(email);
    const setFailedLoginAttempt = await this.redisService.setOnRedis(
      `failed-login-attempt-${email}`,
      (failedLoginAttempt + 1).toString(),
      900,
    );
    if (!setFailedLoginAttempt) {
      throw OauthDomainError.internalServerError(
        'Failure to save failed login attempt',
      );
    }
  }
  async getFailedLoginAttempt(email: string): Promise<number> {
    const failedLoginAttempt = await this.redisService.getOnRedis(
      `failed-login-attempt-${email}`,
    );
    return Number(failedLoginAttempt || 0);
  }
  async saveUnblockAccountCodeOTP(code: number, email: string): Promise<void> {
    const saveCodeOTP = await this.redisService.setOnRedis(
      `unblock-account-${code}`,
      JSON.stringify({ email: email }),
      300,
    );
    if (!saveCodeOTP) {
      throw OauthDomainError.internalServerError('Failure to save code OTP');
    }
  }
  async saveMFASchema(
    mfaSchemaId: string,
    mfaSchema: MFASchemaValueObject,
  ): Promise<string> {
    const saveMFASchemaOnRedis = await this.redisService.setOnRedis(
      `oauth:mfa:schema:${mfaSchemaId}`,
      mfaSchema.toStringify(),
      240,
    );
    if (!saveMFASchemaOnRedis) {
      throw OauthDomainError.invalidGrant(
        'Failure to save MFA Schema on redis!',
      );
    }
    return saveMFASchemaOnRedis;
  }
  async consumeMFASchema(
    mfaSchemaId: string,
  ): Promise<MFASchemaValueObject | null> {
    const payloadMFASchema = await this.redisService.getOnRedis(
      `oauth:mfa:schema:${mfaSchemaId}`,
    );
    if (!payloadMFASchema) {
      throw OauthDomainError.invalidGrant('MFA Schema ID not found');
    }
    return MFASchemaValueObject.toJSON(payloadMFASchema);
  }
  async deleteMFASchema(mfaSchemaId: string): Promise<void> {
    await this.redisService.deleteFromRedis(`oauth:mfa:schema:${mfaSchemaId}`);
  }
}
