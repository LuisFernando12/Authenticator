import { BaseUseCase } from '../../../core/application/use-case/base.use-case';
import { RedisService } from '../../../core/domain/service/redis.service';
import { MFA } from '../../domain/entity/mfa.entity';
import { MFARepositoryPort } from '../port/mfa-repository.port';
import { TOTPPort } from '../port/totp.port';
interface ITOTPGenerateQrCode {
  userId: string;
  email: string;
}
export class TOTPGenerateQrCodeUseCase implements BaseUseCase<
  ITOTPGenerateQrCode,
  string
> {
  constructor(
    private readonly redisService: RedisService,
    private readonly totpPort: TOTPPort,
    private readonly mfaRepository: MFARepositoryPort,
  ) {}
  async execute({ userId, email }: ITOTPGenerateQrCode): Promise<string> {
    const existingMFA = await this.mfaRepository.findByUserId(userId);
    MFA.alreadyExistsMFA(existingMFA);
    const secret = this.totpPort.generateSecret();
    const base32Secret = this.totpPort.encodeSecretToBase32(secret);
    const saveSecret = await this.redisService.setOnRedis(
      `totp-${userId}`,
      secret,
      300,
    );
    if (!saveSecret) {
      throw new Error('Failure to save on redis');
    }
    const uri = this.totpPort.generateTOTPUri(
      base32Secret,
      email,
      'Authenticator',
    );
    const qrCode = await this.totpPort.generateQRCode(uri);
    return qrCode;
  }
}
