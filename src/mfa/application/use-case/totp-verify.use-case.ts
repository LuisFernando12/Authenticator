import { UserRepositoryPort } from '../../../core/application/port/user-repository.port';
import { BaseUseCase } from '../../../core/application/use-case/base.use-case';
import { RedisService } from '../../../core/domain/service/redis.service';

import { MFARepositoryPort } from '../port/mfa-repository.port';
import { TokenServicePort } from '../port/token-service.port';
import { TOTPPort } from '../port/totp.port';
interface ITOTPVerify {
  email: string;
  userId: string;
  code: string;
  jti: string;
}
export interface IGenerateTokenResponse {
  access_token: string;
  refresh_token: string;
  expiresAt: string;
}
export class TOTPVerifyUseCase implements BaseUseCase<
  ITOTPVerify,
  IGenerateTokenResponse | URL
> {
  constructor(
    private readonly totpPort: TOTPPort,
    private readonly mfaRepository: MFARepositoryPort,
    private readonly tokenServicePort: TokenServicePort,
    private readonly userRepositoryPort: UserRepositoryPort,
    private readonly redisService: RedisService,
  ) {}
  async execute({ userId, code, email, jti }: ITOTPVerify): Promise<any> {
    const mfaDB = await this.mfaRepository.findByUserId(userId);
    if (!mfaDB || mfaDB.every((mfa) => mfa.type !== 'TOTP')) {
      throw Error;
    }

    const totp = mfaDB.find((mfa) => mfa.type === 'TOTP').totp;
    this.totpPort.verifyTOTP(code, totp.secret);
    const userDB = await this.userRepositoryPort.findByEmail(email);

    await this.redisService.deleteFromRedis(`mfa-access-token-${jti}`);

    return await this.tokenServicePort.generateToken({
      payload: {
        sub: userId,
        username: userDB.email,
        type: 'access',
      },
    });
  }
}
