import { OauthRequest } from '../../domain/entity/oauth-request.entity';
import { MFASchemaValueObject } from '../../domain/value-object/mfa-schema.value-object';
export interface IOauthRequestCodePayload {
  userEmail: string;
  codeChallenge: string | null;
  codeChallengeMethod: string | null;
  scope: string;
}
export interface ITokenFamilyRevoked {
  jti: string;
  tokenFamilyId: string;
  refreshToken: string;
  expiresAt: Date;
  email: string;
}
export const REDIS_SERVICE_PORT = Symbol('REDIS_SERVICE_PORT');
export abstract class RedisServicePort {
  abstract saveAuthRequest(authRequest: OauthRequest): Promise<string>;

  abstract consumeOauthRequest(oauthRequestId: string): Promise<OauthRequest>;
  abstract consumeOauthCode(key: string): Promise<any>;
  abstract saveOauthAuthorizationCode(
    key: string,
    payloadOauthCodeRedis: IOauthRequestCodePayload,
  ): Promise<string>;
  abstract saveUnblockAccountCodeOTP(
    code: number,
    email: string,
  ): Promise<void>;
  abstract addJtiTokenOnBlockList(jti: string): Promise<string>;
  abstract addTokenFamilyToReuseDetection(
    payloadTokenFamily: ITokenFamilyRevoked,
  ): Promise<string>;
  abstract consultHasJtiTokenOnBlockList(key: string): Promise<boolean>;
  abstract consultHasTokenFamilyOnReuseDetection(
    refreshToken: string,
  ): Promise<ITokenFamilyRevoked>;
  abstract setFailedLoginAttempt(email: string): Promise<void>;
  abstract getFailedLoginAttempt(email: string): Promise<number>;
  abstract saveMFASchema(
    mfaSchemaId: string,
    mfaSchema: MFASchemaValueObject,
  ): Promise<string>;
  abstract getMFASchema(
    mfaChallenge: string,
  ): Promise<MFASchemaValueObject | null>;
  abstract deleteMFASchema(mfaChallenge: string): Promise<void>;
}
