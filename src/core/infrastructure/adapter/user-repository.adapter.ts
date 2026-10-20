import { Inject, Injectable } from '@nestjs/common';
import { User } from '../../../user/domain/entity/user.entity';
import { UserRepository } from '../../../user/infrastructure/persistence/repository/user.repository';
import { UserRepositoryPort } from '../../application/port/user-repository.port';

@Injectable()
export class UserRepositoryAdapter implements UserRepositoryPort {
  constructor(
    @Inject(UserRepository) private readonly userRepository: UserRepository,
  ) {}
  async findByEmail(email: string): Promise<User> {
    return this.userRepository.findByEmail(email);
  }
}
