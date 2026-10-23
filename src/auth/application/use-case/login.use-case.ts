import { HttpStatus } from '@nestjs/common';
import { BaseUseCase } from '../../../core/application/use-case/base.use-case';
import { SecurityEventType } from '../../../security-event/domain/enum/security-event-type.enum';
import { SeverityType } from '../../../security-event/domain/enum/severity-type.enum';
import { AuthFlow } from '../../domain/enum/auth-flow.enum';
import { AuthDomainError } from '../../domain/error/auth-domain.error';
import { ConfigServicePort } from '../port/config-service.port';
import { EmailServicePort } from '../port/email-service.port';
import { GenerateOtpServicePort } from '../port/generate-otp-service.port';
import { MFARepositoryPort } from '../port/mfa-repository.port';
import { RedisServicePort } from '../port/redis-service.port';
import {
  InvalidLoginAttemptReasonType,
  SecurityEventPort,
} from '../port/security-event.port';
import { TokenServicePort } from '../port/token-service.port';
import { UserRepositoryPort } from '../port/user-repository.port';
import { UserValidateCredentialsServicePort } from '../port/user-validate-credentials-service.port';
export interface ILoginUseCasePayload {
  email: string;
  password: string;
  ip: string;
  userAgent: string;
}
export interface ILoginUseCaseResponse {
  access_token: string;
  refresh_token: string;
  expiresAt: string;
  redirect_uri: string;
}
export interface ILoginUseCaseResponseWithMFA {
  mfa_access_token: string;
  mfa_required: boolean;
  mfa_available: Array<string>;
}
export class LoginUseCase implements BaseUseCase<
  ILoginUseCasePayload,
  ILoginUseCaseResponse | ILoginUseCaseResponseWithMFA
> {
  constructor(
    private readonly userRepositoryPort: UserRepositoryPort,
    private readonly userValidateCredentialsServicePort: UserValidateCredentialsServicePort,
    private readonly tokenServicePort: TokenServicePort,
    private readonly configServicePort: ConfigServicePort,
    private readonly securityEventPort: SecurityEventPort,
    private readonly redisServicePort: RedisServicePort,
    private readonly emailServicePort: EmailServicePort,
    private readonly generateOtpServicePort: GenerateOtpServicePort,
    private readonly mfaRepositoryPort: MFARepositoryPort,
  ) {}
  private readonly MAX_ATTEMPTS_FAILED = 5;
  async execute({
    ip,
    userAgent,
    email,
    password,
  }: ILoginUseCasePayload): Promise<
    ILoginUseCaseResponse | ILoginUseCaseResponseWithMFA
  > {
    try {
      const userDB = await this.userRepositoryPort.findByEmail(email);

      const isMatchedPassword =
        await this.userValidateCredentialsServicePort.validate(
          password,
          userDB.password,
        );
      userDB.passwordMismatch(isMatchedPassword);
      userDB.isVerifiedAccount(AuthFlow.login);
      const mfaDB = await this.mfaRepositoryPort.findByUserId(userDB.id);
      if (mfaDB.length > 0) {
        const { mfa_access_token, mfa_access_token_id } =
          await this.tokenServicePort.generateMFAToken({
            sub: userDB.id,
            username: userDB.email,
            type: 'mfa',
          });
        await this.redisServicePort.saveMFATokenId(mfa_access_token_id);
        return {
          mfa_access_token: mfa_access_token,
          mfa_required: true,
          mfa_available: mfaDB.map((mfa) => mfa.type),
        };
      }
      const token = await this.tokenServicePort.generateToken({
        sub: userDB.id,
        username: userDB.email,
      });

      return {
        access_token: token.accessToken,
        refresh_token: token.refreshToken,
        expiresAt: token.expiresAt,
        redirect_uri: this.configServicePort.redirectURI,
      };
    } catch (error) {
      if (error instanceof AuthDomainError) {
        if (error.status === HttpStatus.UNAUTHORIZED) {
          const failedLoginAttempt =
            await this.redisServicePort.getFailedLoginAttempt(email);
          if (failedLoginAttempt >= this.MAX_ATTEMPTS_FAILED) {
            const userDB = await this.userRepositoryPort.findByEmail(email);
            let reason: InvalidLoginAttemptReasonType = 'USER_NOT_FOUND';
            if (userDB) {
              reason = 'INVALID_PASSWORD';
              const code = this.generateOtpServicePort.generateOTP();
              await this.redisServicePort.saveUnblockAccountCodeOTP(
                code,
                email,
              );
              await this.emailServicePort.blockAccount({
                email: email,
                username: userDB.name,
                code: code,
              });
              await this.userRepositoryPort.blockAccount(email);
            }
            this.securityEventPort.emit({
              type: SecurityEventType.INVALID_LOGIN_ATTEMPT,
              email: email,
              severity: SeverityType.HIGH,
              ip: ip,
              userAgent: userAgent,
              reason,
            });
            throw error;
          }
          await this.redisServicePort.setFailedLoginAttempt(email);
        }
      }
      throw error;
    }
  }
}
