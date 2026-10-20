import { User } from '../../../user/domain/entity/user.entity';

export const USER_REPOSITORY_PORT = Symbol('USER_REPOSITORY_PORT ');

export interface UserRepositoryPort {
  findByEmail(email: string): Promise<User>;
}
