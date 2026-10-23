import { BaseUseCase } from '../../../core/application/use-case/base.use-case';
import { IGenerateToken } from '../interface/generate-token.interface';
import { GenerateJTIPort } from '../port/generate-jti.port';
import { JwtServicePort } from '../port/jwt-service.port';
export type IGenerateMFATokenPayload = Required<
  Omit<IGenerateToken, 'scope' | 'aud' | 'iss'>
>;
export interface IGenerateMFATokenResponse {
  mfa_access_token: string;
  mfa_access_token_id: string;
}
export class GenerateMFATokenUseCase implements BaseUseCase<
  IGenerateToken,
  IGenerateMFATokenResponse
> {
  constructor(
    private readonly jwtServicePort: JwtServicePort,
    private readonly generateUUIDPort: GenerateJTIPort,
  ) {}
  async execute(payload: IGenerateToken): Promise<IGenerateMFATokenResponse> {
    const jti = this.generateUUIDPort.generate();
    const token = await this.jwtServicePort.signAsync(
      { ...payload, jti: jti },
      '4min',
    );
    return {
      mfa_access_token: token,
      mfa_access_token_id: jti,
    };
  }
}
