import { TOTPVerifyUseCase } from '@/mfa/application/use-case/totp-verify.use-case';
import { MFA } from '@/mfa/domain/entity/mfa.entity';
import { TOTP } from '@/mfa/domain/entity/totp.entity';
import { MFAType } from '@/mfa/domain/enum/mfa-type.enum';

describe('TOTPVerifyUseCase', () => {
  it('validates the enrolled TOTP and returns user tokens', async () => {
    const totpPort = { verifyTOTP: jest.fn() };
    const mfaRepository = {
      findByUserId: jest.fn().mockResolvedValue([
        MFA.create({
          type: MFAType.TOTP,
          userId: 'user-1',
          active: true,
          totp: TOTP.create({ secret: 'secret', mfaId: 'mfa-1' }),
        }),
      ]),
    };
    const tokenService = {
      generateToken: jest.fn().mockResolvedValue({
        access_token: 'access',
        refresh_token: 'refresh',
        expiresAt: 'later',
      }),
    };
    const userRepository = {
      findByEmail: jest.fn().mockResolvedValue({ email: 'user@example.com' }),
    };
    const redisService = {
      deleteFromRedis: jest.fn().mockResolvedValue(undefined),
    };
    const useCase = new TOTPVerifyUseCase(
      totpPort as any,
      mfaRepository as any,
      tokenService as any,
      userRepository as any,
      redisService as any,
    );

    await expect(
      useCase.execute({
        userId: 'user-1',
        email: 'user@example.com',
        code: '123456',
        jti: 'jti-000',
      }),
    ).resolves.toEqual({
      access_token: 'access',
      refresh_token: 'refresh',
      expiresAt: 'later',
    });
    expect(totpPort.verifyTOTP).toHaveBeenCalledWith('123456', 'secret');
    expect(tokenService.generateToken).toHaveBeenCalledWith({
      payload: { sub: 'user-1', username: 'user@example.com', type: 'access' },
    });
  });
});
