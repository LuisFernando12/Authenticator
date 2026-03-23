import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { AuthLogger } from '../../../src/config/logger/auth-logger.config';
import { BaseLogger } from '../../../src/config/logger/base-logger';
import { UserRepository } from '../../../src/repository/user.repository';
import { AppConfigEnvService } from '../../../src/service/app-config-env.service';
import { AuthService, IAuthService } from '../../../src/service/auth.service';
import { EmailService } from '../../../src/service/email.service';
import { RedisService } from '../../../src/service/redis.service';
import { TokenService } from '../../../src/service/token.service';
import { mockAppconfigEnvService } from '../mock/appConfigEnv.mock';
import { mockEmailService } from '../mock/email.mock';
import { mockAuthLogger, mockBaseLogger } from '../mock/logger.mock';
import { mockRedisService } from '../mock/redis.mock';
import { mockTokenService } from '../mock/token.mock';
import { mockUserRepository } from '../mock/user.mock';
function encryptPassword(password: string): string {
  const salt = bcrypt.genSaltSync();
  return bcrypt.hashSync(password, salt);
}
describe('AuthService', () => {
  let authService: IAuthService;
  const mockUser = {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    password: encryptPassword('password123'),
    isVerified: true,
    userClientConsent: [],
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: AuthLogger,
          useValue: mockAuthLogger,
        },
        {
          provide: BaseLogger,
          useValue: mockBaseLogger,
        },
        {
          provide: UserRepository,
          useValue: mockUserRepository,
        },
        {
          provide: TokenService,
          useValue: mockTokenService,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
        {
          provide: AppConfigEnvService,
          useValue: mockAppconfigEnvService,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();
    authService = module.get<IAuthService>(AuthService);
  });
  it('should be defined', () => {
    expect(authService).toBeDefined();
  });
  describe('login', () => {
    const password = 'password123';
    it('should login a user', async () => {
      mockUser.isVerified = true;
      mockUserRepository.findByEmail = jest
        .fn()
        .mockResolvedValueOnce(mockUser);
      mockTokenService.generateToken = jest.fn().mockResolvedValueOnce({
        token: 'token',
        refresh_token: 'refresh_token',
        expireAt: 'expireAt',
      });
      const result = await authService.login(mockUser.email, password);
      expect(result).toEqual({
        token: 'token',
        expireAt: expect.any(String),
        refresh_token: expect.any(String),
        redirect_uri: mockAppconfigEnvService.redirectURI,
      });
    });
    it('should throw an error to login a user', async () => {
      mockUserRepository.findByEmail = jest.fn().mockResolvedValueOnce(null);
      const promise = authService.login(mockUser.email, password);
      await expect(promise).rejects.toThrow(UnauthorizedException);
      await expect(promise).rejects.toThrow(
        'Email or Password incorrect, please verify and try again',
      );
    });
    it('should throw an error to login a user with wrong password', async () => {
      mockUserRepository.findByEmail = jest
        .fn()
        .mockResolvedValueOnce(mockUser);
      const promise = authService.login(mockUser.email, 'wrongpassword');
      await expect(promise).rejects.toThrow(UnauthorizedException);
      await expect(promise).rejects.toThrow(
        'Email or Password incorrect, please verify and try again',
      );
    });
    it('should throw an error to login a user with unverified account', async () => {
      mockUser.isVerified = false;
      mockUserRepository.findByEmail = jest
        .fn()
        .mockResolvedValueOnce(mockUser);
      const promise = authService.login(mockUser.email, password);
      await expect(promise).rejects.toThrow(
        'Please verify your email and active your account',
      );
      await expect(promise).rejects.toThrow(UnauthorizedException);
    });
    it('should throw an error to generate token with string token', async () => {
      mockUser.isVerified = true;
      mockUserRepository.findByEmail = jest
        .fn()
        .mockResolvedValueOnce(mockUser);
      mockTokenService.generateToken = jest.fn().mockResolvedValueOnce('token');
      const promise = authService.login(mockUser.email, password);
      await expect(promise).rejects.toThrow(InternalServerErrorException);
      await expect(promise).rejects.toThrow('Failure to generate token');
    });
    it('should throw an error to generate token with null or undefined token', async () => {
      mockUser.isVerified = true;
      mockUserRepository.findByEmail = jest
        .fn()
        .mockResolvedValueOnce(mockUser);
      mockTokenService.generateToken = jest
        .fn()
        .mockResolvedValueOnce(undefined);
      const promise = authService.login(mockUser.email, password);
      await expect(promise).rejects.toThrow(InternalServerErrorException);
      await expect(promise).rejects.toThrow('Failure to generate token');
    });
  });
  describe('verifyEmail', () => {
    const token = {
      sub: '1',
      username: 'john.doe@example.com',
      type: 'verify-email',
    };

    it('should verify an email', async () => {
      mockTokenService.verifyToken = jest.fn().mockResolvedValueOnce(token);
      mockUserRepository.findByEmail = jest
        .fn()
        .mockResolvedValueOnce(mockUser);
      mockUserRepository.activeAccount = jest.fn().mockResolvedValueOnce(true);
      const result = await authService.verifyEmail('token');
      expect(result).toEqual({ message: 'Account activated successfully' });
    });
    it('should throw an error to verify an email with invalid token', async () => {
      mockTokenService.verifyToken = jest.fn().mockResolvedValueOnce(false);
      const promise = authService.verifyEmail('token');
      await expect(promise).rejects.toThrow('Unauthorized');
      await expect(promise).rejects.toThrow(UnauthorizedException);
    });
    it('should throw a error to verify email with a invalid user', async () => {
      mockTokenService.verifyToken = jest.fn().mockResolvedValueOnce(token);
      mockUserRepository.findByEmail = jest.fn().mockResolvedValueOnce(null);
      const promise = authService.verifyEmail('token');
      await expect(promise).rejects.toThrow('Bad Request');
      await expect(promise).rejects.toThrow(BadRequestException);
    });
    it('should throw a error to active account', async () => {
      mockTokenService.verifyToken = jest.fn().mockResolvedValueOnce(token);
      mockUserRepository.findByEmail = jest
        .fn()
        .mockResolvedValueOnce(mockUser);
      mockUserRepository.activeAccount = jest.fn().mockResolvedValueOnce(false);
      const promise = authService.verifyEmail('token');
      await expect(promise).rejects.toThrow('Failure to activate account');
      await expect(promise).rejects.toThrow(InternalServerErrorException);
    });
  });
  describe('resetPassword', () => {
    const email = 'john.doe@example.com';
    it('should reset password', async () => {
      mockUserRepository.findByEmail = jest
        .fn()
        .mockResolvedValueOnce(mockUser);
      mockRedisService.set = jest.fn().mockResolvedValueOnce('reset-password');
      mockEmailService.resetPassword = jest.fn().mockResolvedValueOnce('OK');
      const result = await authService.resetPassword(email);
      expect(result).toEqual({ message: 'Recovery Email Sent ' });
    });
    it('should throw an error to reset password with invalid user', async () => {
      mockUserRepository.findByEmail = jest.fn().mockResolvedValueOnce(null);
      const promise = authService.resetPassword(email);
      await expect(promise).rejects.toThrow('User not found');
      await expect(promise).rejects.toThrow(NotFoundException);
    });
    it('should throw an error to reset password with failure to send email', async () => {
      mockUserRepository.findByEmail = jest
        .fn()
        .mockResolvedValueOnce(mockUser);
      mockRedisService.set = jest.fn().mockResolvedValueOnce('reset-password');
      mockEmailService.resetPassword = jest
        .fn()
        .mockResolvedValueOnce('Failure to send email');
      const promise = authService.resetPassword(email);
      await expect(promise).rejects.toThrow(
        'Failure to reset password, try again',
      );
      await expect(promise).rejects.toThrow(InternalServerErrorException);
    });
  });
  describe('newPassword', () => {
    const password = 'password123';
    const code = 123456;
    const email = 'john.doe@example.com';
    it('should update password', async () => {
      mockRedisService.getdel = jest.fn().mockResolvedValueOnce(code);
      mockUserRepository.updatePassword = jest.fn().mockResolvedValueOnce(true);
      const result = await authService.newPassword(password, code, email);
      expect(result).toEqual({ message: 'Updated password' });
    });
    it('should throw an error to update password with invalid code', async () => {
      mockRedisService.get = jest.fn().mockResolvedValueOnce(null);
      const promise = authService.newPassword(password, code, email);
      await expect(promise).rejects.toThrow('Invalid code !');
      await expect(promise).rejects.toThrow(BadRequestException);
    });
    it('should throw an error to update password with failure to update password', async () => {
      mockRedisService.getdel = jest.fn().mockResolvedValueOnce(code);
      mockUserRepository.updatePassword = jest
        .fn()
        .mockResolvedValueOnce(false);
      const promise = authService.newPassword(password, code, email);
      await expect(promise).rejects.toThrow('Failure to update password');
      await expect(promise).rejects.toThrow(InternalServerErrorException);
    });
  });
  describe('sendNewTokenToEmailActive', () => {
    const email = 'john.doe@example.com';
    mockUser.isVerified = false;
    it('should send new token to email active', async () => {
      mockUser.isVerified = false;
      mockUserRepository.findByEmail = jest
        .fn()
        .mockResolvedValueOnce(mockUser);
      mockTokenService.generateToken = jest.fn().mockResolvedValueOnce('token');
      mockEmailService.sendActivationEmail = jest
        .fn()
        .mockResolvedValueOnce('OK');
      const result = await authService.sendNewTokenToEmailActive(email);
      expect(result).toEqual({
        message: 'Success to send new token to email active',
      });
    });
    it('should throw an error to send new token to email active with invalid user', async () => {
      mockUserRepository.findByEmail = jest.fn().mockResolvedValueOnce(null);
      const promise = authService.sendNewTokenToEmailActive(email);
      await expect(promise).rejects.toThrow('User not found');
      await expect(promise).rejects.toThrow(NotFoundException);
    });
    it('should throw an error to send new token to email active with account already active', async () => {
      mockUser.isVerified = true;
      mockUserRepository.findByEmail = jest
        .fn()
        .mockResolvedValueOnce(mockUser);
      const promise = authService.sendNewTokenToEmailActive(email);
      await expect(promise).rejects.toThrow('Account already active');
      await expect(promise).rejects.toThrow(BadRequestException);
    });
    it('should throw an error to generate token', async () => {
      mockUser.isVerified = false;
      mockUserRepository.findByEmail = jest
        .fn()
        .mockResolvedValueOnce(mockUser);
      mockTokenService.generateToken = jest.fn().mockResolvedValueOnce(false);
      const promise = authService.sendNewTokenToEmailActive(email);
      await expect(promise).rejects.toThrow('Failure to generate token');
      await expect(promise).rejects.toThrow(InternalServerErrorException);
    });
    it('should throw an error to send new token to email to active account', async () => {
      jest.clearAllMocks();
      mockUserRepository.findByEmail = jest
        .fn()
        .mockResolvedValueOnce(mockUser);
      mockTokenService.generateToken = jest.fn().mockResolvedValueOnce('token');
      mockEmailService.sendActivationEmail = jest
        .fn()
        .mockResolvedValueOnce('Failure to send email');
      const promise = authService.sendNewTokenToEmailActive(email);
      await expect(promise).rejects.toThrow('Failure to send email');
      await expect(promise).rejects.toThrow(InternalServerErrorException);
    });
  });
});
