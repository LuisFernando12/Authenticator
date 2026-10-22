import { Token } from '../../domain/entity/token.entity';
import { IGenerateToken } from '../interface/generate-token.interface';
import { DeleteByTokenFamilyIdUseCase } from '../use-case/delete-by-token-family-id.use-case';
import { FindByRefreshTokenUseCase } from '../use-case/find-by-refresh-token.use-case';
import { FindByTokenFamilyIdUseCase } from '../use-case/find-by-token-family-id.use-case';
import { GenerateEmailVerificationTokenUseCase } from '../use-case/generate-email-verification-token.use-case';
import {
  GenerateMFATokenUseCase,
  IGenerateMFATokenPayload,
  IGenerateMFATokenResponse,
} from '../use-case/generate-mfa-token.use-case';
import {
  GenerateTokenUseCase,
  IGenerateTokenPayload,
  IGenerateTokenResponse,
} from '../use-case/generate-token.use-case';
import {
  IRefreshTokenPayload,
  RefreshTokenUseCase,
} from '../use-case/refresh-token.use-case';
import { RevokeTokenUseCase } from '../use-case/revoke-token.use-case';
import {
  IResponseTokenIntrospect,
  TokenIntrospectUseCase,
} from '../use-case/token-introspect.use-case';
import { VerifyTokenUseCase } from '../use-case/verify-token.use-case';
export abstract class TokenService {
  abstract generate({
    payload,
    consentId,
  }: IGenerateTokenPayload): Promise<IGenerateTokenResponse>;
  abstract generateMFAToken(
    payload: IGenerateMFATokenPayload,
  ): Promise<IGenerateMFATokenResponse>;
  abstract refreshToken({
    payload,
    oldRefreshToken,
  }: IRefreshTokenPayload): Promise<IGenerateTokenResponse>;
  abstract revoke(token: string): Promise<{ message: string }>;
  abstract tokenIntrospect(
    token: string,
  ): Promise<IResponseTokenIntrospect | { active: boolean }>;
  abstract verify(token: string): Promise<any>;
  abstract findByRefreshToken(refreshTokenHash: string): Promise<Token>;
  abstract findByTokenFamilyId(tokenFamilyId: string): Promise<Token[]>;
  abstract generateEmailVerificationToken(
    payload: IGenerateToken,
  ): Promise<string>;
  abstract deleteByTokenFamilyId(tokenFamilyId: string): Promise<void>;
}
export class TokenServiceImpls implements TokenService {
  constructor(
    private readonly generateTokenUseCase: GenerateTokenUseCase,
    private readonly generateMFATokenUseCase: GenerateMFATokenUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly revokeTokenUseCase: RevokeTokenUseCase,
    private readonly tokenIntrospectUseCase: TokenIntrospectUseCase,
    private readonly verifyTokenUseCase: VerifyTokenUseCase,
    private readonly findByRefreshTokenUseCase: FindByRefreshTokenUseCase,
    private readonly generateEmailVerificationTokenUseCase: GenerateEmailVerificationTokenUseCase,
    private readonly findByTokenFamilyIdUseCase: FindByTokenFamilyIdUseCase,
    private readonly deleteByTokenFamilyIdUseCase: DeleteByTokenFamilyIdUseCase,
  ) {}
  async generate({
    payload,
    consentId,
  }: IGenerateTokenPayload): Promise<IGenerateTokenResponse> {
    return await this.generateTokenUseCase.execute({
      payload,
      consentId: consentId || null,
    });
  }
  async generateMFAToken(
    payload: IGenerateMFATokenPayload,
  ): Promise<IGenerateMFATokenResponse> {
    return await this.generateMFATokenUseCase.execute(payload);
  }
  async refreshToken({
    payload,
    oldRefreshToken,
  }: IRefreshTokenPayload): Promise<IGenerateTokenResponse> {
    return await this.refreshTokenUseCase.execute({ payload, oldRefreshToken });
  }
  async revoke(token: string): Promise<{ message: string }> {
    return await this.revokeTokenUseCase.execute(token);
  }
  async tokenIntrospect(
    token: string,
  ): Promise<IResponseTokenIntrospect | { active: boolean }> {
    return await this.tokenIntrospectUseCase.execute(token);
  }
  async verify(token: string): Promise<any> {
    return await this.verifyTokenUseCase.execute(token);
  }
  async findByRefreshToken(refreshTokenHash: string): Promise<Token> {
    return await this.findByRefreshTokenUseCase.execute(refreshTokenHash);
  }
  async findByTokenFamilyId(tokenFamilyId: string): Promise<Token[]> {
    return await this.findByTokenFamilyIdUseCase.execute(tokenFamilyId);
  }
  async generateEmailVerificationToken(
    payload: IGenerateToken,
  ): Promise<string> {
    return await this.generateEmailVerificationTokenUseCase.execute(payload);
  }
  async deleteByTokenFamilyId(tokenFamilyId: string): Promise<void> {
    return await this.deleteByTokenFamilyIdUseCase.execute(tokenFamilyId);
  }
}
