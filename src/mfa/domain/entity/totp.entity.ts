import { MFAError } from '../error/mfa.error';
import { MFA } from './mfa.entity';

export interface TOTPProps {
  id?: string;
  secret: string;
  mfaId: string;
  mfa?: MFA;
  createdAt?: Date;
}
export class TOTP {
  constructor(private readonly props: TOTPProps) {}
  static create(props: TOTPProps): TOTP {
    return new TOTP(props);
  }
  get id(): string | undefined {
    return this.props.id;
  }
  get secret(): string {
    return this.props.secret;
  }
  get mfaId(): string {
    return this.props.mfaId;
  }
  get mfa(): MFA | undefined {
    return this.props.mfa;
  }
  get createdAt(): Date | undefined {
    return this.props.createdAt;
  }
  validateSecret(secret: string): string {
    if (this.props.secret.trim() !== secret.trim()) {
      throw MFAError.invalidTOTPSecret(
        'The provided secret is invalid, expired, revoked, does not match the expected value, or was issued to another client.',
      );
    }
    return this.props.secret;
  }
  toJSON() {
    return {
      id: this.id,
      secret: this.secret,
      mfaId: this.mfaId,
      mfa: this.mfa,
      createdAt: this.createdAt,
    };
  }
}
