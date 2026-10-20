export interface IDynamicTransaction<T, D> {
  firstRepository: T;
  secondRepository: D;
}
export const TRANSACTION_PORT = Symbol('TRANSACTION_PORT');
export abstract class TransactionPort<T, D> {
  abstract executeTransaction<R>(
    work: (manager: IDynamicTransaction<T, D>) => Promise<R>,
  ): Promise<R>;
}
