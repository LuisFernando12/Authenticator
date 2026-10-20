import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MFARepositoryPort } from '../../../application/port/mfa-repository.port';
import { MFA } from '../../../domain/entity/mfa.entity';
import { TOTP } from '../../../domain/entity/totp.entity';
import { MFAType } from '../../../domain/enum/mfa-type.enum';
import { MFAError } from '../../../domain/error/mfa.error';
import { MFAEntity } from '../entity/mfa.entity';

export class MFARepositoryImpl implements MFARepositoryPort {
  constructor(
    @InjectRepository(MFAEntity)
    private readonly mfaRepository: Repository<MFAEntity>,
  ) {}
  async findByUserId(userId: string): Promise<MFA[]> {
    try {
      const mfaDB = await this.mfaRepository.find({
        where: { userId: userId },
      });
      if (!mfaDB || mfaDB.length === 0) {
        return [];
      }
      return mfaDB.map((mfaEntity) => {
        return new MFA({
          id: mfaEntity.id,
          type: mfaEntity.type as MFAType,
          userId: mfaEntity.userId,
          active: mfaEntity.active,
          totp: TOTP.create({
            id: mfaEntity.totp?.id,
            secret: mfaEntity.totp?.secret,
            mfaId: mfaEntity.id,
          }),
        });
      });
    } catch {
      throw MFAError.internalServerError('Error to find MFA');
    }
  }
  async save(mfa: MFA): Promise<MFA | null> {
    try {
      const savedMFA = await this.mfaRepository.save(mfa.toJSON());
      return savedMFA;
    } catch (error) {
      throw MFAError.failedToSaveMFA(`Failed to save MFA: ${error}`);
    }
  }
  async update(mfa: MFA): Promise<MFA | null> {
    try {
      const updatedMFA = await this.mfaRepository.save(mfa);
      return updatedMFA;
    } catch (error) {
      throw MFAError.failedToUpdateMFA(`Failed to update MFA: ${error}`);
    }
  }
}
