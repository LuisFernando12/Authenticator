import { SecurityEventType } from '../../../security-event/domain/enum/security-event-type.enum';
import { SeverityType } from '../../../security-event/domain/enum/severity-type.enum';
import {
  HttpStatus,
  OauthDomainError,
} from '../../domain/error/oauth-domain.error';
import { MountUrlValueObject } from '../../domain/value-object/mount-url.value-object';
import { EmailServicePort } from '../port/email-service.port';
import { GenerateIdServicePort } from '../port/generate-id-service.port';
import { GenerateOtpServicePort } from '../port/generate-otp-service.port';
import { RedisServicePort } from '../port/redis-service-port';
import {
  InvalidLoginAttemptReasonType,
  SecurityEventPort,
} from '../port/security-event.port';
import { ConsentServicePort } from '../port/user-client-consent-service.port';
import { UserServicePort } from '../port/user-service.port';

export interface IQueryOauthLogin {
  oauthRequestId: string;
  responseType: string;
  clientId: string;
  redirectUri: string;
  state: string;
  scope: string;
  codeChallenge?: string;
  codeChallengeMethod?: string;
}
export interface ILoginUseCasePayload {
  email: string;
  password: string;
  ip: string;
  userAgent: string;
}

export class LoginUseCase {
  constructor(
    private readonly redisServicePort: RedisServicePort,
    private readonly userServicePort: UserServicePort,
    private readonly consentServicePort: ConsentServicePort,
    private readonly generateIdServicePort: GenerateIdServicePort,
    private readonly securityEventPort: SecurityEventPort,
    private readonly generateOtpServicePort: GenerateOtpServicePort,
    private readonly emailServicePort: EmailServicePort,
  ) {}
  private readonly MAX_ATTEMPTS_FAILED = 5;
  async execute(
    payload: ILoginUseCasePayload,
    queryOauthLogin: IQueryOauthLogin,
  ): Promise<URL> {
    try {
      const { oauthRequestId, clientId, scope, redirectUri, state } =
        queryOauthLogin;
      const { email, password } = payload;
      const oauthRequest =
        await this.redisServicePort.consumeOauthRequest(oauthRequestId);

      oauthRequest.requestMatch(queryOauthLogin);

      const userDB = await this.userServicePort.validateUserCredentials({
        email,
        password,
      });

      const code = this.generateIdServicePort.generateOauthAuthorizationCode();
      const payloadOauthCodeRedis = {
        userEmail: email,
        codeChallenge: oauthRequest.codeChallenge,
        codeChallengeMethod: oauthRequest.codeChallengeMethod,
        scope: oauthRequest.scope,
      };
      await this.redisServicePort.saveOauthAuthorizationCode(
        code,
        payloadOauthCodeRedis,
      );

      await this.consentServicePort.findOrCreateConsent(
        userDB.id,
        clientId,
        scope,
      );

      return MountUrlValueObject.mount(redirectUri, { code, state });
    } catch (error: any) {
      if (error instanceof OauthDomainError) {
        if (error.status === HttpStatus.FORBIDDEN) {
          const failedLoginAttempt =
            await this.redisServicePort.getFailedLoginAttempt(payload.email);
          if (failedLoginAttempt >= this.MAX_ATTEMPTS_FAILED) {
            const userDB = await this.userServicePort.findByEmail(
              payload.email,
            );
            let reason: InvalidLoginAttemptReasonType = 'USER_NOT_FOUND';
            if (userDB) {
              reason = 'INVALID_PASSWORD';
              const code = this.generateOtpServicePort.generateOTP();
              await this.redisServicePort.saveUnblockAccountCodeOTP(
                code,
                payload.email,
              );
              await this.emailServicePort.blockAccount({
                email: payload.email,
                username: userDB.name,
                code: code,
              });
              await this.userServicePort.blockAccount(payload.email);
            }
            this.securityEventPort.emit({
              ip: payload.ip,
              userAgent: payload.userAgent,
              severity: SeverityType.HIGH,
              type: SecurityEventType.INVALID_OAUTH_LOGIN_ATTEMPT,
              email: payload.email,
              reason,
            });
            throw error;
          }
          await this.redisServicePort.setFailedLoginAttempt(payload.email);
        }
      }
      throw error;
    }
  }
}
