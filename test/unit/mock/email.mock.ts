import { IEmailService } from '../../../src/service/email.service';

export const mockEmailService: IEmailService = {
  sendActivationEmail: jest.fn(),
  resetPassword: jest.fn().mockResolvedValue('OK'),
};
