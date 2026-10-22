import { TokenService } from '@/token/application/service/token.service';
import {
  IGenerateTokenPayload,
  IGenerateTokenResponse,
} from '../../../token/application/use-case/generate-token.use-case';
import { TokenServicePort } from '../../application/port/token-service.port';

export class TokenServiceAdapter implements TokenServicePort {
  constructor(private readonly tokenService: TokenService) {}
  async generateToken(
    payload: IGenerateTokenPayload,
  ): Promise<IGenerateTokenResponse> {
    try {
      return await this.tokenService.generate(payload);
    } catch (error) {
      throw new Error('Error to generate token !', { cause: error });
    }
  }
}
