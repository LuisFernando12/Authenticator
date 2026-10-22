import { BaseUseCase } from '../../../core/application/use-case/base.use-case';
import { IGenerateToken } from '../interface/generate-token.interface';
import { JwtServicePort } from '../port/jwt-service.port';
export type IGenerateMFATokenPayload = Required<
  Omit<IGenerateToken, 'scope' | 'aud' | 'iss'>
>;
export interface IGenerateMFATokenResponse {
  mfa_access_token: string;
}
export class GenerateMFATokenUseCase implements BaseUseCase<
  IGenerateToken,
  IGenerateMFATokenResponse
> {
  constructor(private readonly jwtServicePort: JwtServicePort) {}
  async execute(payload: IGenerateToken): Promise<IGenerateMFATokenResponse> {
    const token = await this.jwtServicePort.signAsync({ ...payload }, '4min');

    return {
      mfa_access_token: token,
    };
  }
}
