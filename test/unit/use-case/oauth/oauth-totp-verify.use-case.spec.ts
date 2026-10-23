import { MFA } from '@/mfa/domain/entity/mfa.entity';
import { TOTP } from '@/mfa/domain/entity/totp.entity';
import { MFAType } from '@/mfa/domain/enum/mfa-type.enum';
import { OauthTOTPVerifyUseCase } from '@/oauth/application/use-case/oauth-totp-verify.use-case';
import { OauthDomainError } from '@/oauth/domain/error/oauth-domain.error';
import { MFASchemaValueObject } from '@/oauth/domain/value-object/mfa-schema.value-object';

describe('OauthTOTPVerifyUseCase', () => {
  const queryOauth = {
    oauthRequestId: 'request-1',
    responseType: 'code',
    clientId: 'client-1',
    redirectUri: 'https://example.com/callback',
    state: 'state-1',
    scope: 'read',
    codeChallenge: 'challenge',
    codeChallengeMethod: 'sha256',
    mfaSchemaId: 'schema-1',
  };
  let useCase: OauthTOTPVerifyUseCase;
  let totpPort: { verifyTOTP: jest.Mock };
  let mfaRepository: { findByUserId: jest.Mock };
  let userService: { findByEmail: jest.Mock };
  let redis: {
    consumeMFASchema: jest.Mock;
    consumeOauthRequest: jest.Mock;
    saveOauthAuthorizationCode: jest.Mock;
    deleteMFASchema: jest.Mock;
  };
  let idService: { generateOauthAuthorizationCode: jest.Mock };
  let consent: { findOrCreateConsent: jest.Mock };

  beforeEach(() => {
    totpPort = { verifyTOTP: jest.fn() };
    mfaRepository = {
      findByUserId: jest.fn().mockResolvedValue([
        MFA.create({
          type: MFAType.TOTP,
          userId: 'user-1',
          active: true,
          totp: TOTP.create({ secret: 'secret', mfaId: 'mfa-1' }),
        }),
      ]),
    };
    userService = {
      findByEmail: jest
        .fn()
        .mockResolvedValue({ id: 'user-1', email: 'a@example.com' }),
    };
    redis = {
      consumeMFASchema: jest.fn().mockResolvedValue(
        MFASchemaValueObject.create({
          userId: 'user-1',
          email: 'a@example.com',
          oauthRequestId: 'request-1',
        }),
      ),
      consumeOauthRequest: jest.fn().mockResolvedValue({
        requestMatch: jest.fn(),
        codeChallenge: 'challenge',
        codeChallengeMethod: 'sha256',
        scope: 'read',
      }),
      saveOauthAuthorizationCode: jest.fn().mockResolvedValue('OK'),
      deleteMFASchema: jest.fn().mockResolvedValue(undefined),
    };
    idService = {
      generateOauthAuthorizationCode: jest.fn().mockReturnValue('auth-code'),
    };
    consent = { findOrCreateConsent: jest.fn().mockResolvedValue(undefined) };
    useCase = new OauthTOTPVerifyUseCase(
      totpPort as any,
      mfaRepository as any,
      userService as any,
      redis as any,
      idService as any,
      consent as any,
    );
  });

  it('validates TOTP, persists OAuth code and consent, then returns the callback URL', async () => {
    const result = await useCase.execute({ code: '123456', queryOauth });
    expect(result).toBeInstanceOf(URL);
    expect(result.toString()).toBe(
      'https://example.com/callback?code=auth-code&state=state-1',
    );
    expect(totpPort.verifyTOTP).toHaveBeenCalledWith('123456', 'secret');
    expect(redis.saveOauthAuthorizationCode).toHaveBeenCalledWith('auth-code', {
      userEmail: 'a@example.com',
      codeChallenge: 'challenge',
      codeChallengeMethod: 'sha256',
      scope: 'read',
    });
    expect(consent.findOrCreateConsent).toHaveBeenCalledWith(
      'user-1',
      'client-1',
      'read',
    );
    expect(redis.deleteMFASchema).toHaveBeenCalledWith('schema-1');
  });

  it('rejects when no TOTP is registered', async () => {
    mfaRepository.findByUserId.mockResolvedValue([]);
    await expect(
      useCase.execute({ code: '123456', queryOauth }),
    ).rejects.toThrow(OauthDomainError);
    expect(totpPort.verifyTOTP).not.toHaveBeenCalled();
  });

  it('rejects a schema associated with another OAuth request', async () => {
    redis.consumeMFASchema.mockResolvedValue(
      MFASchemaValueObject.create({
        userId: 'user-1',
        email: 'a@example.com',
        oauthRequestId: 'other',
      }),
    );
    await expect(
      useCase.execute({ code: '123456', queryOauth }),
    ).rejects.toThrow('Invalid Oauth Request ID');
    expect(mfaRepository.findByUserId).not.toHaveBeenCalled();
  });

  it('propagates TOTP validation errors and does not consume the OAuth request', async () => {
    totpPort.verifyTOTP.mockImplementation(() => {
      throw new Error('Invalid totp code');
    });
    await expect(useCase.execute({ code: 'bad', queryOauth })).rejects.toThrow(
      'Invalid totp code',
    );
    expect(redis.consumeOauthRequest).not.toHaveBeenCalled();
  });
});
