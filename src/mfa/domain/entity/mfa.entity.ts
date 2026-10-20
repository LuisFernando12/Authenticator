import { MFAType } from '../enum/mfa-type.enum';
import { MFAError } from '../error/mfa.error';
import { TOTP } from './totp.entity';

export interface MFAProps {
  id?: string;
  type: MFAType;
  userId: string;
  active: boolean;
  totp?: TOTP;
  createdAt?: Date;
}
export class MFA {
  constructor(private readonly props: MFAProps) {}
  static create(props: MFAProps): MFA {
    return new MFA(props);
  }
  get id(): string | undefined {
    return this.props.id;
  }
  get type(): MFAType {
    return this.props.type;
  }
  get userId(): string {
    return this.props.userId;
  }
  get active(): boolean {
    return this.props.active;
  }
  get totp(): TOTP | undefined {
    return this.props.totp;
  }
  get createdAt(): Date | undefined {
    return this.props.createdAt;
  }
  static alreadyExistsMFA(mfas: MFA[] | undefined) {
    if (mfas && mfas?.length > 0 && mfas.some((mfa) => mfa.type === 'TOTP')) {
      throw MFAError.alreadyRegisteredMFA(
        'TOTP already registered for this user',
      );
    }
  }
  toJSON() {
    return {
      id: this.id,
      type: this.type,
      userId: this.userId,
      active: this.active,
      createdAt: this.createdAt,
      totp: this.totp,
    };
  }
}
