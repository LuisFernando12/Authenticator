import {
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserDTO } from '../../../src/dto/user.dto';
import { UserRepository } from '../../../src/repository/user.repository';
import { EmailService } from '../../../src/service/email.service';
import { TokenService } from '../../../src/service/token.service';
import { UserService } from '../../../src/service/user.service';
import { mockEmailService } from '../mock/email.mock';
import { mockTokenService } from '../mock/token.mock';
import { mockUserRepository } from '../mock/user.mock';

describe('UserService', () => {
  let userService: UserService;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: UserRepository,
          useValue: mockUserRepository,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
        {
          provide: TokenService,
          useValue: mockTokenService,
        },
      ],
    }).compile();
    userService = module.get<UserService>(UserService);
  });
  it('should be defined', () => {
    expect(userService).toBeDefined();
  });
  describe('register', () => {
    const user: UserDTO = {
      name: 'John Doe',
      email: 'john.doe@example.com',
      password: 'password123',
    };
    it('should register a new user', async () => {
      mockUserRepository.create = jest.fn().mockResolvedValueOnce(user);
      mockUserRepository.existsUser = jest.fn().mockResolvedValueOnce(false);
      mockUserRepository.activeAccount = jest.fn().mockResolvedValueOnce(true);
      mockEmailService.sendActivationEmail = jest
        .fn()
        .mockResolvedValueOnce('OK');

      const result = await userService.register(user);
      expect(result).toBe('OK');
      expect(mockUserRepository.create).toHaveBeenCalledWith(user);
    });
    it('should throw an error if user already exists', async () => {
      mockUserRepository.existsUser = jest.fn().mockResolvedValueOnce(true);
      mockUserRepository.create = jest.fn().mockResolvedValueOnce(user);
      const promise = userService.register(user);
      await expect(promise).rejects.toThrow('User already exists');
      await expect(promise).rejects.toThrow(ConflictException);
    });
    it('should throw an error to create a user in DB', async () => {
      mockUserRepository.create = jest.fn().mockResolvedValueOnce(null);
      await mockUserRepository.create(user);
      expect(mockUserRepository.create).toHaveBeenCalledWith(user);
      expect(mockUserRepository.existsUser).toHaveBeenCalledWith(user.email);
      const promise = userService.register(user);
      await expect(promise).rejects.toThrow('failed user register');
      await expect(promise).rejects.toThrow(InternalServerErrorException);
    });
    it('should throw an error on verification token ', async () => {
      mockUserRepository.create = jest.fn().mockResolvedValueOnce(user);
      mockTokenService.generateToken = jest.fn().mockResolvedValueOnce(null);
      const promise = userService.register(user);
      await expect(promise).rejects.toThrow('Failure to generate token');
      await expect(promise).rejects.toThrow(InternalServerErrorException);
    });
    it('should show  a message "Failure to send email" ', async () => {
      mockTokenService.generateToken = jest.fn().mockResolvedValueOnce('token');
      mockUserRepository.create = jest.fn().mockResolvedValueOnce(user);
      mockEmailService.sendActivationEmail = jest
        .fn()
        .mockResolvedValueOnce('Failure to send email');
      const result = await userService.register(user);
      expect(mockEmailService.sendActivationEmail).toHaveBeenCalledWith(
        user.email,
        user.name,
        'token',
      );
      expect(result).toBe('Failure to send email');
    });
  });
  describe('findByEmail', () => {
    const email = 'john.doe@example.com';
    it('should find a user by email', async () => {
      const createdAt = new Date();
      mockUserRepository.findByEmail = jest.fn().mockResolvedValueOnce({
        id: '1',
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        isVerified: true,
        userClientConsent: [],
        createdAt: createdAt,
      });
      const result = await userService.findByEmail(email);
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(email);
      expect(result).toEqual({
        id: '1',
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        isVerified: true,
        userClientConsent: [],
        createdAt: createdAt,
      });
    });
    it('should throw an error to find a user by email', async () => {
      mockUserRepository.findByEmail = jest.fn().mockRejectedValueOnce(null);
      const promise = userService.findByEmail(email);
      await expect(promise).rejects.toThrow('Failure to find user');
      await expect(promise).rejects.toThrow(InternalServerErrorException);
    });
  });
});
