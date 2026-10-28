import { RedisService } from '../../../core/domain/service/redis.service';
import { RedisServicePort } from '../../application/port/redis-service.port';
import { AuthDomainError } from '../../domain/error/auth-domain.error';

export class RedisServiceAdapter implements RedisServicePort {
  constructor(private readonly redisService: RedisService) {}
  async saveResetPasswordCodeOTP(code: number, email: string): Promise<void> {
    const saveCodeOTP = await this.redisService.setOnRedis(
      `reset-password-${code}`,
      JSON.stringify({ email: email }),
      600,
    );
    if (!saveCodeOTP) {
      throw AuthDomainError.internalServerError('Failure to save code OTP');
    }
  }
  async saveUnblockAccountCodeOTP(code: number, email: string): Promise<void> {
    const saveCodeOTP = await this.redisService.setOnRedis(
      `unblock-account-${code}`,
      JSON.stringify({ email: email }),
      300,
    );
    if (!saveCodeOTP) {
      throw AuthDomainError.internalServerError('Failure to save code OTP');
    }
  }
  async consumeResetPasswordCodeOTP(code: number): Promise<{ email: string }> {
    const objectCodeRedis = await this.redisService.getOnRedis(
      `reset-password-${code}`,
    );
    if (!objectCodeRedis) {
      throw AuthDomainError.badRequest('Invalid code !');
    }
    const codeRedis = JSON.parse(objectCodeRedis);
    return codeRedis;
  }

  async consumeUnblockAccountCodeOTP(code: number): Promise<{ email: string }> {
    const objectCodeRedis = await this.redisService.getOnRedis(
      `unblock-account-${code}`,
    );
    if (!objectCodeRedis) {
      throw AuthDomainError.badRequest('Invalid code !');
    }
    const codeRedis = JSON.parse(objectCodeRedis);
    return codeRedis;
  }
  async clearResetPasswordCodeOTP(code: number): Promise<void> {
    const deleted = await this.redisService.deleteFromRedis(
      `reset-password-${code}`,
    );
    if (deleted === 0)
      throw AuthDomainError.internalServerError(
        'Failed to clear reset password code',
      );
  }
  async clearUnblockAccountCodeOTP(code: number): Promise<void> {
    const deleted = await this.redisService.deleteFromRedis(
      `unblock-account-${code}`,
    );
    if (deleted === 0)
      throw AuthDomainError.internalServerError(
        'Failed to clear unblock account code',
      );
  }
  async setFailedLoginAttempt(email: string): Promise<void> {
    const failedLoginAttempt = await this.getFailedLoginAttempt(email);
    const setFailedLoginAttempt = await this.redisService.setOnRedis(
      `failed-login-attempt-${email}`,
      (failedLoginAttempt + 1).toString(),
      900,
    );
    if (!setFailedLoginAttempt) {
      throw AuthDomainError.internalServerError(
        'Failure to save failed login attempt',
      );
    }
  }
  async getFailedLoginAttempt(email: string): Promise<number> {
    const failedLoginAttempt = await this.redisService.getOnRedis(
      `failed-login-attempt-${email}`,
    );
    return Number(failedLoginAttempt || 0);
  }
  async clearFailedLoginAttempt(email: string): Promise<void> {
    const deleted = await this.redisService.deleteFromRedis(
      `failed-login-attempt-${email}`,
    );
    if (deleted === 0)
      throw AuthDomainError.internalServerError(
        'Failure to clear failed login attempt',
      );
  }
  async saveMFATokenId(tokenId: string): Promise<string> {
    const saveMFAAccessTokenId = await this.redisService.setOnRedis(
      `mfa-access-token-${tokenId}`,
      JSON.stringify({ mfaAccessTokenId: tokenId }),
      240,
    );
    if (!saveMFAAccessTokenId) {
      throw AuthDomainError.internalServerError('Failure to save code OTP');
    }
    return saveMFAAccessTokenId;
  }
}
