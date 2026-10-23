export const REDIS_SERVICE_PORT = Symbol('REDIS_SERVICE_PORT');

export abstract class RedisServicePort {
  abstract saveResetPasswordCodeOTP(code: number, email: string): Promise<void>;
  abstract saveUnblockAccountCodeOTP(
    code: number,
    email: string,
  ): Promise<void>;
  abstract consumeResetPasswordCodeOTP(
    code: number,
  ): Promise<{ email: string }>;

  abstract consumeUnblockAccountCodeOTP(
    code: number,
  ): Promise<{ email: string }>;
  abstract clearResetPasswordCodeOTP(code: number): Promise<void>;
  abstract clearUnblockAccountCodeOTP(code: number): Promise<void>;
  abstract setFailedLoginAttempt(email: string): Promise<void>;
  abstract getFailedLoginAttempt(email: string): Promise<number>;
  abstract clearFailedLoginAttempt(email: string): Promise<void>;
  abstract saveMFATokenId(tokenId: string): Promise<string>;
  abstract consumeMFATokenId(tokenId: string): Promise<void>;
}
