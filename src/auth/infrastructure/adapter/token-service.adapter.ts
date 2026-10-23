import { TokenService } from '../../../token/application/service/token.service';
import {
  IPayloadToken,
  TokenServicePort,
} from '../../application/port/token-service.port';
import { AuthToken } from '../../domain/entity/auth-token.entity';
import { AuthDomainError } from '../../domain/error/auth-domain.error';
import { VerifyTokenValueObject } from '../../domain/value-object/verify-token.value-object';

export class TokenServiceAdapter implements TokenServicePort {
  constructor(private readonly tokenService: TokenService) {}
  async generateToken(payload: IPayloadToken): Promise<AuthToken> {
    const token = await this.tokenService.generate({ payload });
    if (!token) {
      throw AuthDomainError.internalServerError('Failure to generate token');
    }
    return new AuthToken({
      access_token: token.access_token,
      refresh_token: token.refresh_token,
      expiresAt: token.expiresAt,
    });
  }
  async generateMFAToken(
    payload: IPayloadToken & { type: 'mfa' },
  ): Promise<{ mfa_access_token: string; mfa_access_token_id: string }> {
    return await this.tokenService.generateMFAToken(payload);
  }
  async verifyToken(token: string): Promise<VerifyTokenValueObject> {
    const tokenVerify = await this.tokenService.verify(token);
    if (!tokenVerify) {
      throw AuthDomainError.unauthorized('Invalid token');
    }
    const { sub, username, type, jti, iat, exp } = tokenVerify;
    return VerifyTokenValueObject.create({
      sub,
      username,
      type,
      jti,
      iat,
      exp,
    });
  }
  async generateEmailVerificationToken(
    payload: IPayloadToken,
  ): Promise<string> {
    const token =
      await this.tokenService.generateEmailVerificationToken(payload);
    if (!token) {
      throw AuthDomainError.internalServerError('Failure to generate token');
    }
    return token;
  }
}
