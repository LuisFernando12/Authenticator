import { Test, TestingModule } from '@nestjs/testing';
import {
  AuthController,
  IAuthController,
} from '../../../src/controller/auth.controller';
import { AuthService, IAuthService } from '../../../src/service/auth.service';

describe('AuthController', () => {
  let authController: IAuthController;
  const mockAuthService: IAuthService = {
    login: jest.fn(),
    verifyEmail: jest.fn(),
    resetPassword: jest.fn(),
    sendNewTokenToEmailActive: jest.fn(),
    newPassword: jest.fn(),
  };
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();
    authController = module.get<IAuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(true).toBe(true);
  });
  describe('login', () => {
    const email = 'john.doe@example.com';
    const password = 'strongPassword';
    it('should login a user', async () => {
      mockAuthService.login = jest.fn().mockResolvedValue({
        acces_token: 'token',
        refresh_token: 'refreshToken',
        expiresAt: '2023-01-01T00:00:00.000Z',
      });
      const result = await authController.login({ email, password });
      expect(result).toEqual({
        acces_token: 'token',
        refresh_token: 'refreshToken',
        expiresAt: '2023-01-01T00:00:00.000Z',
      });
    });
  });
  describe('verifyEmail', () => {
    it('should verify a email', async () => {
      mockAuthService.verifyEmail = jest.fn().mockResolvedValue({
        message: 'Account activated successfully',
      });
      const result = await authController.verifyEmail('token');
      expect(result).toEqual({
        message: 'Account activated successfully',
      });
    });
  });
  describe('resetPassword', () => {
    it('should reset a password', async () => {
      mockAuthService.resetPassword = jest.fn().mockResolvedValue({
        message: 'Recovery Email Sent',
      });
      const result = await authController.resetPassword({
        email: 'john.doe@example.com',
      });
      expect(result).toEqual({
        message: 'Recovery Email Sent',
      });
    });
  });
  describe('sendNewTokenToEmailActive', () => {
    it('should send a new token to email active', async () => {
      mockAuthService.sendNewTokenToEmailActive = jest.fn().mockResolvedValue({
        message: 'Email sent successfully.',
      });
      const result = await authController.sendNewTokenToEmailActive({
        email: 'john.doe@example.com',
      });
      expect(result).toEqual({
        message: 'Email sent successfully.',
      });
    });
  });
  describe('newPassword', () => {
    it('should update a password', async () => {
      mockAuthService.newPassword = jest.fn().mockResolvedValue({
        message: 'Updated password',
      });
      const result = await authController.newPassword({
        password: 'strongPassword',
        code: 123456,
        email: 'john.doe@example.com',
      });
      expect(result).toEqual({
        message: 'Updated password',
      });
    });
  });
});
