import { TOTPGenerateQrCodeUseCase } from '@/mfa/application/use-case/totp-generate-qrCode.use-case';
import { MFA } from '@/mfa/domain/entity/mfa.entity';
import { MFAType } from '@/mfa/domain/enum/mfa-type.enum';

describe('TOTPGenerateQrCodeUseCase', () => {
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

  it('fails when TOTP already exists or Redis cannot save the secret', async () => {
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
});
