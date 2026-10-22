import { OauthRequest } from '@/oauth/domain/entity/oauth-request.entity';
export interface IOauthRequestCodePayload {
  userEmail: string;
  codeChallenge: string | null;
  codeChallengeMethod: string | null;
  scope: string;
}
export const REDIS_SERVICE_PORT = Symbol('REDIS_SERVICE_PORT');
export abstract class RedisServicePort {
  abstract consumeOauthRequest(oauthRequestId: string): Promise<OauthRequest>;
  abstract saveOauthAuthorizationCode(
    key: string,
    payloadOauthCodeRedis: IOauthRequestCodePayload,
  ): Promise<string>;
}
