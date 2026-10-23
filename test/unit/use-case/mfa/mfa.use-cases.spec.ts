import { TOTPGenerateQrCodeUseCase } from '@/mfa/application/use-case/totp-generate-qrCode.use-case';
import { TOTPRegisterUseCase } from '@/mfa/application/use-case/totp-register.use-case';
import { TOTPVerifyUseCase } from '@/mfa/application/use-case/totp-verify.use-case';
import { MFA } from '@/mfa/domain/entity/mfa.entity';
import { TOTP } from '@/mfa/domain/entity/totp.entity';
import { MFAType } from '@/mfa/domain/enum/mfa-type.enum';

describe('MFA TOTP use cases', () => {
  it('generates and returns a QR code after caching a new secret', async () => {
    const redis = { setOnRedis: jest.fn().mockResolvedValue('OK') };
    const totp = {
      generateSecret: jest.fn().mockReturnValue('hex-secret'),
      encodeSecretToBase32: jest.fn().mockReturnValue('BASE32'),
      generateTOTPUri: jest.fn().mockReturnValue('otpauth://totp'),
      generateQRCode: jest.fn().mockResolvedValue('<svg/>'),
    };
    const repository = { findByUserId: jest.fn().mockResolvedValue([]) };
    const useCase = new TOTPGenerateQrCodeUseCase(
      redis as any,
      totp as any,
      repository as any,
    );
    await expect(
      useCase.execute({ userId: 'user-1', email: 'user@example.com' }),
    ).resolves.toBe('<svg/>');
    expect(redis.setOnRedis).toHaveBeenCalledWith(
      'totp-user-1',
      'hex-secret',
      300,
    );
    expect(totp.generateTOTPUri).toHaveBeenCalledWith(
      'BASE32',
      'user@example.com',
      'Authenticator',
    );
  });

  it('fails QR generation when the user already has TOTP enabled or Redis cannot save the secret', async () => {
    const redis = { setOnRedis: jest.fn().mockResolvedValue(null) };
    const totp = {
      generateSecret: jest.fn().mockReturnValue('hex'),
      encodeSecretToBase32: jest.fn().mockReturnValue('base32'),
    };
    const repository = {
      findByUserId: jest
        .fn()
        .mockResolvedValue([
          MFA.create({ type: MFAType.TOTP, userId: 'user-1', active: true }),
        ]),
    };
    const useCase = new TOTPGenerateQrCodeUseCase(
      redis as any,
      totp as any,
      repository as any,
    );
    await expect(
      useCase.execute({ userId: 'user-1', email: 'user@example.com' }),
    ).rejects.toThrow('TOTP already registered');
    repository.findByUserId.mockResolvedValue([]);
    await expect(
      useCase.execute({ userId: 'user-1', email: 'user@example.com' }),
    ).rejects.toThrow('Failure to save on redis');
  });

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
    const useCase = new TOTPVerifyUseCase(
      totpPort as any,
      mfaRepository as any,
      tokenService as any,
      userRepository as any,
    );
    await expect(
      useCase.execute({
        userId: 'user-1',
        email: 'user@example.com',
        code: '123456',
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
