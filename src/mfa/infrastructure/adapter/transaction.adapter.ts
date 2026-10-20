import {
  IDynamicTransaction,
  TransactionPort,
} from '@/core/application/port/transaction.port';
import { DataSource } from 'typeorm';
import { MFARepositoryImpl } from '../persistence/repository/mfa.repository';
import { TOTPRepositoryImpl } from '../persistence/repository/totp.repository';

export class TransactionAdapter implements TransactionPort<
  MFARepositoryImpl,
  TOTPRepositoryImpl
> {
  constructor(private readonly dataSource: DataSource) {}
  executeTransaction<R>(
    work: (
      manager: IDynamicTransaction<MFARepositoryImpl, TOTPRepositoryImpl>,
    ) => Promise<R>,
  ): Promise<R> {
    return work({
      firstRepository: new MFARepositoryImpl(
        this.dataSource.getRepository('MFAEntity'),
      ),
      secondRepository: new TOTPRepositoryImpl(
        this.dataSource.getRepository('TOTPEntity'),
      ),
    });
  }
}
