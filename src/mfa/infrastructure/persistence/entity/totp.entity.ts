import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { MFAEntity } from './mfa.entity';

@Entity({ name: 'totp' })
export class TOTPEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column({ nullable: false })
  secret: string;
  @Column({ name: 'mfa_id', nullable: false })
  mfaId: string;
  @Column({
    type: 'timestamp with time zone',
    name: 'created_at',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;
  @OneToOne(() => MFAEntity, (mfa) => mfa.id, { nullable: false })
  @JoinColumn({ name: 'mfa_id', referencedColumnName: 'id' })
  mfa: MFAEntity;
}
