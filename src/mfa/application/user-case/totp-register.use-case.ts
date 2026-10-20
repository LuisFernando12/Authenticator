import { TransactionPort } from '../../../core/application/port/transaction.port';
import { BaseUseCase } from '../../../core/application/use-case/base.use-case';
import { RedisService } from '../../../core/domain/service/redis.service';
import { MFA } from '../../domain/entity/mfa.entity';
import { TOTP } from '../../domain/entity/totp.entity';
import { MFAType } from '../../domain/enum/mfa-type.enum';
import { MFAError } from '../../domain/error/mfa.error';
import { MFARepositoryPort } from '../port/mfa-repository.port';
import { TOTPRepositoryPort } from '../port/totp-repository.port';
import { TOTPPort } from '../port/totp.port';
interface ITOTPRegister {
  userId: string;
  code: string;
}
interface ITOTPRegisterResponse {
  message: string;
}
export class TOTPRegisterUseCase implements BaseUseCase<
  ITOTPRegister,
  ITOTPRegisterResponse
> {
  constructor(
    private readonly redisService: RedisService,
    private readonly totpPort: TOTPPort,
    private readonly transactionPort: TransactionPort<
      MFARepositoryPort,
      TOTPRepositoryPort
    >,
  ) {}
  async execute({
    userId,
    code,
  }: ITOTPRegister): Promise<ITOTPRegisterResponse> {
    const secret = await this.redisService.getOnRedis(`totp-${userId}`);
    if (!secret) {
      throw new Error('Secret not found');
    }
    this.totpPort.verifyTOTP(code, secret);
    await this.redisService.deleteFromRedis(`totp-${userId}`);
    await this.transactionPort.executeTransaction(async (manager) => {
      const mfa = MFA.create({
        type: MFAType.TOTP,
        userId,
        active: true,
      });
      const savedMFA = await manager.firstRepository.save(mfa);
      if (!savedMFA) {
        throw MFAError.failedToSaveMFA('Failed to save MFA entity');
      }
      const totp = TOTP.create({
        secret: secret,
        mfaId: savedMFA.id,
      });
      const savedTOTP = await manager.secondRepository.save(totp);
      if (!savedTOTP) {
        throw MFAError.failedToSaveMFA('Failed to save TOTP entity');
      }
    });

    return { message: 'TOTP successfully registered!' };
  }
}
