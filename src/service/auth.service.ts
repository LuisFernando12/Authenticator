import { UserRepository } from '@/repository/user.repository';
import { AppConfigEnvService } from '@/service/app-config-env.service';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'node:crypto';
import { AuthLogger } from '../config/logger/auth-logger.config';
import { EmailService } from './email.service';
import { RedisService } from './redis.service';
import { TokenService } from './token.service';
export interface IAuthService {
  login: (email: string, password: string) => any;
  verifyEmail(email: string): Promise<{ message: string }>;
  resetPassword(email: string): Promise<{ message: string }>;
  newPassword(
    password: string,
    code: number,
    email: string,
  ): Promise<{ message: string }>;
  sendNewTokenToEmailActive(email: string): Promise<{ message: string }>;
}
@Injectable()
export class AuthService implements IAuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly tokenService: TokenService,
    private readonly emailService: EmailService,
    private readonly redisService: RedisService,
    private appconfigEnvService: AppConfigEnvService,
    private readonly authLogger: AuthLogger,
  ) {}
  async login(email: string, password: string) {
    this.authLogger.log('Starting method login', {
      context: 'AuthService method Login',
    });
    const userDB = await this.userRepository.findByEmail(email);
    if (!userDB) {
      this.authLogger.error('Email or Password incorrect: User Not Found', {
        context: 'AuthService method Login',
      });
      throw new UnauthorizedException(
        'Email or Password incorrect, please verify and try again',
      );
    }
    const isMatchedPassword = await bcrypt.compare(password, userDB.password);
    if (!isMatchedPassword) {
      this.authLogger.error('Email or Password incorrect: Incorrect Password', {
        context: 'AuthService method Login',
      });
      throw new UnauthorizedException(
        'Email or Password incorrect, please verify and try again',
      );
    }
    this.authLogger.log('Found user and password matched', {
      context: 'AuthService method Login',
    });
    if (!userDB.isVerified) {
      this.authLogger.error('User not verified', {
        context: 'AuthService method Login',
      });
      throw new UnauthorizedException(
        'Please verify your email and active your account',
      );
    }
    this.authLogger.log('User verified and started to generate token', {
      context: 'AuthService method Login',
    });
    const token = await this.tokenService.generateToken({
      sub: userDB.id,
      username: userDB.email,
    });
    if (!token || typeof token === 'string') {
      this.authLogger.error(
        `Fail on generate token: ${token}, and typeof ${typeof token}`,
        {
          context: 'AuthService method Login',
        },
      );
      throw new InternalServerErrorException('Failure to generate token');
    }
    this.authLogger.log('Token generated successfully', {
      context: 'AuthService method Login',
    });
    return {
      ...token,
      redirect_uri: this.appconfigEnvService.redirectURI,
    };
  }
  async verifyEmail(token: string) {
    this.authLogger.log('Starting method verifyEmail', {
      context: 'AuthService method verifyEmail',
    });
    const tokenIsValid = await this.tokenService.verifyToken(token);
    if (!tokenIsValid || tokenIsValid.type !== 'verify-email') {
      this.authLogger.error(
        `Invalid token: ${tokenIsValid || tokenIsValid.type}`,
        {
          context: 'AuthService method verifyEmail',
        },
      );
      throw new UnauthorizedException();
    }
    const { username } = tokenIsValid;
    const userDB = await this.userRepository.findByEmail(username);
    if (!userDB) {
      this.authLogger.error('User not found', {
        context: 'AuthService method verifyEmail',
      });
      throw new BadRequestException();
    }
    const activeAccountResponse =
      await this.userRepository.activeAccount(username);
    if (!activeAccountResponse) {
      this.authLogger.error(
        `Failure to activate account with response: ${activeAccountResponse} `,
        {
          context: 'AuthService method verifyEmail',
        },
      );
      throw new InternalServerErrorException('Failure to activate account');
    }
    this.authLogger.log('Account activated successfully', {
      context: 'AuthService method verifyEmail',
    });
    return { message: 'Account activated successfully' };
  }
  async resetPassword(email: string): Promise<{ message: string }> {
    this.authLogger.log('Starting method resetPassword', {
      context: 'AuthService method resetPassword',
    });
    const userDB = await this.userRepository.findByEmail(email);
    if (!userDB) {
      this.authLogger.error('User not found', {
        context: 'AuthService method resetPassword',
      });
      throw new NotFoundException('User not found');
    }
    const code = crypto.randomInt(100000, 999999);
    this.redisService.set(`reset-password-${email}`, code, 'EX', 600);
    const emailSend = await this.emailService.resetPassword(
      email,
      userDB.name,
      code,
    );

    if (emailSend !== 'OK') {
      this.authLogger.error(`Failure to send email: ${emailSend}`, {
        context: 'AuthService method resetPassword',
      });
      throw new InternalServerErrorException(
        'Failure to reset password, try again',
      );
    }
    this.authLogger.log('Email sent successfully', {
      context: 'AuthService method resetPassword',
    });
    return { message: 'Recovery Email Sent ' };
  }
  async newPassword(
    password: string,
    code: number,
    email: string,
  ): Promise<{ message: string }> {
    this.authLogger.log('Starting method newPassword', {
      context: 'AuthService method newPassword',
    });
    const codeRedis = Number(
      await this.redisService.getdel(`reset-password-${email}`),
    );
    if (code !== codeRedis) {
      this.authLogger.error(
        'Invalid code: user code mismatch with redis code',
        {
          context: 'AuthService method newPassword',
        },
      );
      throw new BadRequestException('Invalid code !');
    }
    password = await bcrypt.hash(password, bcrypt.genSaltSync());
    const passwordUpdate = await this.userRepository.updatePassword(
      email,
      password,
    );
    if (!passwordUpdate) {
      this.authLogger.error(`Failure to update password: ${passwordUpdate}`, {
        context: 'AuthService method newPassword',
      });
      throw new InternalServerErrorException('Failure to update password');
    }
    this.authLogger.log('Password updated successfully', {
      context: 'AuthService method newPassword',
    });
    return { message: 'Updated password' };
  }
  async sendNewTokenToEmailActive(email: string): Promise<{ message: string }> {
    this.authLogger.log('Starting method sendNewTokenToEmailActive', {
      context: 'AuthService method sendNewTokenToEmailActive',
    });
    const userDB = await this.userRepository.findByEmail(email);
    if (!userDB) {
      this.authLogger.error(`User not found with email: ${email}`, {
        context: 'AuthService method sendNewTokenToEmailActive',
      });
      throw new NotFoundException('User not found');
    }
    const { password: _, ...safeUser } = userDB;
    if (safeUser.isVerified) {
      this.authLogger.error(`User already active with email: ${email}`, {
        context: 'AuthService method sendNewTokenToEmailActive',
      });
      throw new BadRequestException('Account already active');
    }
    const token = await this.tokenService.generateToken({
      sub: safeUser.id,
      username: safeUser.email,
      type: 'verify-email',
    });
    if (!token || typeof token !== 'string') {
      this.authLogger.error(
        `Fail to generate token with: ${token} and typeof ${typeof token}`,
        {
          context: 'AuthService method sendNewTokenToEmailActive',
        },
      );
      throw new InternalServerErrorException('Failure to generate token');
    }
    const sendNewEmail = await this.emailService.sendActivationEmail(
      email,
      safeUser.name,
      token,
    );
    if (sendNewEmail !== 'OK') {
      this.authLogger.error(`Failure to send email: ${sendNewEmail}`, {
        context: 'AuthService method sendNewTokenToEmailActive',
      });
      throw new InternalServerErrorException('Failure to send email');
    }
    this.authLogger.log('Success to send new token to email active', {
      context: 'AuthService method sendNewTokenToEmailActive',
    });
    return { message: 'Success to send new token to email active' };
  }
}
