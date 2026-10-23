import { OauthAccessToken } from '../../domain/entity/oauth-access-token.entity';
import { OauthToken } from '../../domain/entity/oauth-token.entity';

export interface IPayloadToken {
  sub: string;
  username: string;
  scope: string;
  aud: string;
  iss: string;
  type: 'access';
}

export interface IGenerateTokenResponse {
  token_type: 'Bearer';
  access_token: string;
  refresh_token: string;
  scope: string;
  expiresAt: string;
}
export interface ITokenIntrospectResponse {
  active: boolean;
  sub: string;
  client_id: string;
  scope: string;
  exp: number;
  iat: number;
  jti: string;
}

export const TOKEN_SERVICE_PORT = Symbol('TOKEN_SERVICE_PORT');
export abstract class TokenServicePort {
  abstract generateToken(
    payload: IPayloadToken,
    userClientConsentId: string,
  ): Promise<OauthAccessToken>;
  abstract hashRefreshToken(refreshToken: string): string;
  abstract refreshToken(
    payload: IPayloadToken,
    refreshTokenHashed: string,
    consentId?: string,
  ): Promise<OauthAccessToken>;
  abstract findByRefreshToken(refreshTokenHash: string): Promise<OauthToken>;
  abstract revokeToken(refreshToken: string): Promise<void>;
  abstract tokenIntrospect(
    token: string,
  ): Promise<ITokenIntrospectResponse | { active: boolean }>;
  abstract deleteByTokenFamilyId(tokenFamilyId: string): Promise<void>;
}
