import { MailerService } from '@nestjs-modules/mailer';
import { InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppConfigEnvService } from '../../../src/service/app-config-env.service';
import {
  EmailService,
  IEmailService,
} from '../../../src/service/email.service';
import { mockAppconfigEnvService } from '../mock/appConfigEnv.mock';

describe('EmailService', () => {
  let emailService: IEmailService;
  const mockMailerService = {
    sendMail: jest.fn(),
  };
  const email = 'john.doe@example.com';
  const username = 'John Doe';
  const token = 'token';
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: AppConfigEnvService,
          useValue: mockAppconfigEnvService,
        },
        {
          provide: MailerService,
          useValue: mockMailerService,
        },
      ],
    }).compile();
    emailService = module.get<IEmailService>(EmailService);
  });
  it('should be defined', () => {
    expect(emailService).toBeDefined();
  });
  describe('sendActivationEmail', () => {
    const mockBodyEmail = {
      to: email,
      subject: 'Email de ativação',
      template: './activeAccount',
      context: {
        username,
        activeUrl: `${mockAppconfigEnvService.serviceVerifyEmailURL}/?token=${token}`,
      },
    };
    it('should send an activation email', async () => {
      mockMailerService.sendMail = jest.fn().mockResolvedValueOnce({
        accepted: [email],
      });
      const mailerResult = await emailService.sendActivationEmail(
        email,
        username,
        token,
      );
      expect(mockMailerService.sendMail).toHaveBeenCalledWith(mockBodyEmail);
      expect(mailerResult).toBe('OK');
    });
    it('should return failure to send email', async () => {
      mockMailerService.sendMail = jest.fn().mockResolvedValueOnce({
        accepted: [],
      });
      const mailerResult = await emailService.sendActivationEmail(
        email,
        username,
        token,
      );
      expect(mailerResult).toBe('Failure to send email');
    });
    it('should throw an error to send an activation email', async () => {
      mockMailerService.sendMail = jest.fn().mockRejectedValueOnce(null);
      const promise = emailService.sendActivationEmail(email, username, token);
      await expect(promise).rejects.toThrow(InternalServerErrorException);
      await expect(promise).rejects.toThrow('Failure to send email');
    });
  });
  describe('resetPassword', () => {
    const code = 123456;
    const mockBodyEmailRestPassword = {
      to: email,
      subject: 'Recuperação de senha',
      template: './resetPassword',
      context: {
        username,
        resetPasswordURL: `${mockAppconfigEnvService.serviceResetPasswordUrl}`,
        code,
      },
    };
    it('should send a reset password email', async () => {
      mockMailerService.sendMail = jest.fn().mockResolvedValueOnce({
        accepted: [email],
      });
      const mailerResult = await emailService.resetPassword(
        email,
        username,
        code,
      );
      expect(mockMailerService.sendMail).toHaveBeenCalledWith(
        mockBodyEmailRestPassword,
      );
      expect(mailerResult).toBe('OK');
    });
    it('should return failure to send email', async () => {
      mockMailerService.sendMail = jest.fn().mockResolvedValueOnce({
        accepted: [],
      });
      const mailerResult = await emailService.resetPassword(
        email,
        username,
        code,
      );
      expect(mailerResult).toBe('Failure to send email');
    });
    it('should throw an error to send a reset password email', async () => {
      mockMailerService.sendMail = jest.fn().mockRejectedValueOnce(null);
      const promise = emailService.resetPassword(email, username, code);
      await expect(promise).rejects.toThrow(InternalServerErrorException);
      await expect(promise).rejects.toThrow('Failure to send email');
    });
  });
});
