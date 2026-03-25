import { UserRepository } from '@/repository/user.repository';
import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserDTO, UserResponseDTO } from '../dto/user.dto';
import { EmailService } from './email.service';
import { TokenService } from './token.service';
export interface IUserService {
  register: (user: UserDTO) => Promise<string>;
  findByEmail: (
    email: string,
  ) => Promise<UserResponseDTO & { password: string }>;
}
@Injectable()
export class UserService implements IUserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly emailService: EmailService,
    private readonly tokenService: TokenService,
  ) {}

  private async encryptPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt();
    return await bcrypt.hash(password, salt);
  }
  async register(user: UserDTO) {
    if (await this.userRepository.existsUser(user.email)) {
      throw new ConflictException('User already exists');
    }

    user.password = await this.encryptPassword(user.password);
    const userDB = await this.userRepository.create(user);

    if (!userDB) {
      throw new InternalServerErrorException('failed user register');
    }
    try {
      const verification_token = await this.tokenService.generateToken({
        sub: userDB.id,
        username: userDB.email,
        type: 'verify-email',
      });
      if (!verification_token || typeof verification_token !== 'string') {
        throw new InternalServerErrorException('Failure to generate token');
      }
      const emailResponse = await this.emailService.sendActivationEmail(
        userDB.email,
        userDB.name,
        verification_token as string,
      );
      return emailResponse;
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }
  async findByEmail(
    email: string,
  ): Promise<UserResponseDTO & { password: string }> {
    try {
      return await this.userRepository.findByEmail(email);
    } catch (_error) {
      throw new InternalServerErrorException('Failure to find user');
    }
  }
}
