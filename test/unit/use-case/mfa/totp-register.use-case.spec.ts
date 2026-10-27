import { TOTPRegisterUseCase } from '@/mfa/application/use-case/totp-register.use-case';
import { MFA } from '@/mfa/domain/entity/mfa.entity';
import { TOTP } from '@/mfa/domain/entity/totp.entity';
import { MFAType } from '@/mfa/domain/enum/mfa-type.enum';

describe('TOTPRegisterUseCase', () => {
  it('registers TOTP transactionally after validating and clearing the cached secret', async () => {
    const redis = {
      getOnRedis: jest.fn().mockResolvedValue('hex-secret'),
      deleteFromRedis: jest.fn(),
    };
    const totp = { verifyTOTP: jest.fn() };
    const firstRepository = {
      save: jest.fn().mockResolvedValue(
        MFA.create({
          id: 'mfa-1',
          type: MFAType.TOTP,
          userId: 'user-1',
          active: true,
        }),
      ),
    };
    const secondRepository = {
      save: jest
        .fn()
        .mockResolvedValue(
          TOTP.create({ id: 'totp-1', secret: 'hex-secret', mfaId: 'mfa-1' }),
        ),
    };
    const transaction = {
      executeTransaction: jest.fn(async (work) =>
        work({ firstRepository, secondRepository }),
      ),
    };
    const useCase = new TOTPRegisterUseCase(
      redis as any,
      totp as any,
      transaction as any,
    );

    await expect(
      useCase.execute({ userId: 'user-1', code: '123456' }),
    ).resolves.toEqual({ message: 'TOTP successfully registered!' });
    expect(totp.verifyTOTP).toHaveBeenCalledWith('123456', 'hex-secret');
    expect(redis.deleteFromRedis).toHaveBeenCalledWith('totp-user-1');
    expect(firstRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({}),
    );
    expect(secondRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({}),
    );
  });

  it('does not register when the cached secret is missing or persistence fails', async () => {
    const redis = {
      getOnRedis: jest.fn().mockResolvedValue(null),
      deleteFromRedis: jest.fn(),
    };
    const transaction = { executeTransaction: jest.fn() };
    const useCase = new TOTPRegisterUseCase(
      redis as any,
      { verifyTOTP: jest.fn() } as any,
      transaction as any,
    );

    await expect(
      useCase.execute({ userId: 'user-1', code: '123456' }),
    ).rejects.toThrow('Secret not found');
    redis.getOnRedis.mockResolvedValue('secret');
    transaction.executeTransaction.mockImplementation(async (work: any) =>
      work({
        firstRepository: { save: jest.fn().mockResolvedValue(null) },
        secondRepository: { save: jest.fn() },
      }),
    );
    await expect(
      useCase.execute({ userId: 'user-1', code: '123456' }),
    ).rejects.toThrow('Failed to save MFA entity');
  });
});
