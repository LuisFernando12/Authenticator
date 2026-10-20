import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from '../../../../user/infrastructure/persistence/entity/user.entity';
import { TOTPEntity } from './totp.entity';
@Entity('mfa')
export class MFAEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column({ type: 'enum', name: 'type', enum: ['TOTP', 'SMS', 'EMAIL'] })
  type: 'TOTP' | 'SMS' | 'EMAIL';
  @ManyToOne(() => UserEntity, (user) => user.mfa, {
    nullable: false,
  })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: UserEntity;
  @Column({ name: 'user_id' })
  userId: string;
  @Column({ default: true })
  active: boolean;
  @Column({
    type: 'timestamp with time zone',
    name: 'created_at',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;
  @OneToOne(() => TOTPEntity, (totp) => totp.mfa, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  totp: TOTPEntity;
}
