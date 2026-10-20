import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TOTPRepositoryPort } from '../../../application/port/totp-repository.port';
import { MFA } from '../../../domain/entity/mfa.entity';
import { TOTP } from '../../../domain/entity/totp.entity';
import { MFAType } from '../../../domain/enum/mfa-type.enum';
import { MFAError } from '../../../domain/error/mfa.error';
import { TOTPEntity } from '../entity/totp.entity';

export class TOTPRepositoryImpl implements TOTPRepositoryPort {
  constructor(
    @InjectRepository(TOTPEntity)
    private readonly totpRepository: Repository<TOTPEntity>,
  ) {}
  async findByMFAId(mfaId: string): Promise<TOTP> {
    const totpDB = await this.totpRepository.findOne({
      where: {
        mfaId: mfaId,
      },
    });
    if (!totpDB) {
      throw MFAError.notFoundMFA('TOTP not found by MFA ID');
    }
    return TOTP.create({
      id: totpDB.id,
      mfaId: totpDB.mfaId,
      secret: totpDB.secret,
      mfa: MFA.create({
        id: totpDB.mfa.id,
        type: totpDB.mfa.type as MFAType,
        userId: totpDB.mfa.userId,
        active: totpDB.mfa.active,
      }),
    });
  }
  async save(totp: TOTP): Promise<TOTP | null> {
    try {
      const savedTOTP = await this.totpRepository.save(totp.toJSON());
      return TOTP.create({
        id: savedTOTP.id,
        mfaId: savedTOTP.mfaId,
        mfa: savedTOTP.mfa,
        secret: savedTOTP.secret,
        createdAt: savedTOTP.createdAt,
      });
    } catch (error) {
      throw MFAError.internalServerError(`Failed to save TOTP: ${error}`);
    }
  }
  async update(totp: TOTP): Promise<TOTP | null> {
    const updatedTOTP = await this.totpRepository.update(
      {
        id: totp.id,
      },
      { ...totp },
    );

    if (updatedTOTP.affected === 0) {
      throw new Error('Failure to update TOTP');
    }
    return updatedTOTP.raw;
  }
}
