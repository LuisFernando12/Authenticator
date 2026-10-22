import { MFA } from '@/mfa/domain/entity/mfa.entity';

export const MFA_REPOSITORY_PORT = Symbol('MFA_REPOSITORY_PORT');

export abstract class MFARepositoryPort {
  abstract findByUserId(userId: string): Promise<MFA[] | []>;
}
