import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { AppConfigEnvService } from './app-config-env.service';

export interface IEmailService {
  sendActivationEmail(
    email: string,
    username: string,
    token: string,
  ): Promise<string>;
  resetPassword(email: string, username: string, code: number): Promise<string>;
}

@Injectable()
export class EmailService implements IEmailService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly configEnv: AppConfigEnvService,
  ) {}
  async sendActivationEmail(
    email: string,
    username: string,
    token: string,
  ): Promise<string> {
    try {
      const mailerResponse = await this.mailerService.sendMail({
        to: email,
        subject: 'Email de ativação',
        template: './activeAccount',
        context: {
          username,
          activeUrl: `${this.configEnv.serviceVerifyEmailURL}/?token=${token}`,
        },
      });
      if (mailerResponse.accepted.length === 0) {
        return 'Failure to send email';
      }
      return 'OK';
    } catch (error) {
      throw new InternalServerErrorException('Failure to send email', {
        cause: error,
      });
    }
  }
  async resetPassword(
    email: string,
    username: string,
    code: number,
  ): Promise<string> {
    try {
      const mailerResponse = await this.mailerService.sendMail({
        to: email,
        subject: 'Recuperação de senha',
        template: './resetPassword',
        context: {
          username,
          resetPasswordURL: `${this.configEnv.serviceResetPasswordUrl}`,
          code,
        },
      });
      if (mailerResponse.accepted.length === 0) {
        return 'Failure to send email';
      }
      return 'OK';
    } catch (error) {
      throw new InternalServerErrorException('Failure to send email', {
        cause: error,
      });
    }
  }
}
