import { BaseUseCase } from '../../../core/application/use-case/base.use-case';

import { MFARepositoryPort } from '../port/mfa-repository.port';
import { TOTPPort } from '../port/totp.port';
interface ITOTPVerify {
  userId: string;
  code: string;
}
export class TOTPVerifyUseCase implements BaseUseCase<ITOTPVerify, void> {
  constructor(
    private readonly totpPort: TOTPPort,
    private readonly mfaRepository: MFARepositoryPort,
  ) {}
  async execute({ userId, code }: ITOTPVerify): Promise<void> {
    const mfaDB = await this.mfaRepository.findByUserId(userId);
    if (!mfaDB || mfaDB.some((mfa) => mfa.type !== 'TOTP')) {
      throw Error;
    }

    const totp = mfaDB.find((mfa) => mfa.type === 'TOTP').totp;
    this.totpPort.verifyTOTP(code, totp.secret);
  }
}
