import {
  IGenerateTokenPayload,
  IGenerateTokenResponse,
} from '@/token/application/use-case/generate-token.use-case';

export const TOKEN_SERVICE_PORT = Symbol('TOKEN_SERVICE_PORT');

export abstract class TokenServicePort {
  abstract generateToken(
    payload: IGenerateTokenPayload,
  ): Promise<IGenerateTokenResponse>;
}
