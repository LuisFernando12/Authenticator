import { AuthToken } from '../../domain/entity/auth-token.entity';
import { VerifyTokenValueObject } from '../../domain/value-object/verify-token.value-object';
export interface IPayloadToken {
  sub: string;
  username: string;
}

export const TOKEN_SERVICE_PORT = Symbol('TOKEN_SERVICE_PORT');
export abstract class TokenServicePort {
  abstract generateToken(payload: IPayloadToken): Promise<AuthToken>;
  abstract generateMFAToken(
    payload: IPayloadToken & { type: 'mfa' },
  ): Promise<{ mfa_access_token: string }>;
  abstract verifyToken(token: string): Promise<VerifyTokenValueObject>;
  abstract generateEmailVerificationToken(
    payload: IPayloadToken,
  ): Promise<string>;
}
