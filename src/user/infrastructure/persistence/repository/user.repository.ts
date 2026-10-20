import { User } from '@/user/domain/entity/user.entity';
import {
  UserEntity,
  UserEntityType,
} from '@/user/infrastructure/persistence/entity/user.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { UserDTO, UserResponseDTO } from '../../dto/user.dto';
export interface IUserRepository {
  create(
    data: UserEntityType,
  ): Promise<Omit<UserResponseDTO, 'userClientConsent'> & { password: string }>;
  findByEmail(email: string): Promise<User>;
  existsUser(email: string): Promise<boolean>;
  activeAccount(email: string): Promise<boolean>;
  updatePassword(email: string, password: string): Promise<boolean>;
  blockAccount(email: string): Promise<void>;
  unblockAccount(email: string): Promise<void>;
}

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}
  async activeAccount(email: string): Promise<boolean> {
    const userDB = await this.userRepository.update(
      { email: email },
      { isVerified: true },
    );
    if (userDB.affected === 0) {
      return false;
    }
    return true;
  }
  async existsUser(email: string): Promise<boolean> {
    return await this.userRepository.existsBy({ email });
  }
  async create(
    data: UserDTO,
  ): Promise<
    Omit<UserResponseDTO, 'userClientConsent'> & { password: string }
  > {
    const user = this.userRepository.create(data);
    return await this.userRepository.save(user);
  }
  async findByEmail(email: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { email: email },
    });
    return new User({
      id: user.id,
      name: user.name,
      email: user.email,
      password: user.password,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
    });
  }
  async updatePassword(email: string, password: string) {
    const userDB = await this.userRepository.update(
      { email: email },
      { password },
    );
    if (userDB.affected === 0) {
      return false;
    }
    return true;
  }
  async blockAccount(email: string): Promise<void> {
    await this.userRepository.update({ email: email }, { isVerified: false });
    await this.userRepository.softDelete({ email: email });
  }
  async unblockAccount(email: string): Promise<void> {
    await this.userRepository.update(
      { email: email },
      { isVerified: true, deletedAt: null },
    );
  }
}
