import { TOTP } from '../../domain/entity/totp.entity';

export const TOTP_REPOSITORY_PORT = Symbol('TOTP_REPOSITORY_PORT');

export abstract class TOTPRepositoryPort {
  abstract findByMFAId(mfaId: string): Promise<TOTP | null>;
  abstract save(totp: TOTP): Promise<TOTP | null>;
  abstract update(totp: TOTP): Promise<TOTP | null>;
}
