import { LoginUseCase } from '@/auth/application/use-case/login.use-case';
import { AuthDomainError } from '@/auth/domain/error/auth-domain.error';
import { authMocked, AuthMockedType } from './mock/index.mock';

describe('LoginUseCase', () => {
  let loginUseCase: LoginUseCase;
  let authMock: AuthMockedType;

  beforeEach(() => {
    authMock = authMocked();
    loginUseCase = new LoginUseCase(
      authMock.userRepositoryFake,
      authMock.userValidateCredentialsServiceFake,
      authMock.tokenServiceFake,
      authMock.configServiceFake,
      authMock.securityEventFake,
      authMock.redisServiceFake,
      authMock.emailServiceFake,
      authMock.generateOtpServiceFake,
      { findByUserId: async () => [] } as any,
    );
  });

  const payload = {
    email: 'john.doe@example.com',
    password: 'test-password',
    ip: '127.0.0.1',
    userAgent: 'test-user-agent',
  };

  it('should be defined', () => {
    expect(loginUseCase).toBeDefined();
  });

  it('should login a user', async () => {
    const result = await loginUseCase.execute(payload);

    expect(result.access_token).toBe('test-access-token');
    expect(result.refresh_token).toBe('test-refresh-token');
    expect(result.redirect_uri).toBe('https://example.com/callback');
  });

  it('should throw an error if the user is not found', async () => {
    jest
      .spyOn(authMock.userRepositoryFake, 'findByEmail')
      .mockRejectedValueOnce(AuthDomainError.notFound('User not found'));

    const promise = loginUseCase.execute(payload);

    await expect(promise).rejects.toThrow('User not found');
  });

  it('should throw an error if the password does not match', async () => {
    jest
      .spyOn(authMock.userValidateCredentialsServiceFake, 'validate')
      .mockResolvedValueOnce(false);

    const promise = loginUseCase.execute(payload);

    await expect(promise).rejects.toThrow(
      'Email or Password incorrect, please verify and try again',
    );
  });

  it('should throw an error if the account is not verified', async () => {
    jest
      .spyOn(authMock.userRepositoryFake, 'findByEmail')
      .mockResolvedValueOnce(
        authMock.mockAuthUser({
          id: 'test-user-id',
          name: 'John Doe',
          email: 'john.doe@example.com',
          password: 'hashed-test-password',
          isVerified: false,
          createdAt: new Date(),
        }),
      );

    const promise = loginUseCase.execute(payload);

    await expect(promise).rejects.toThrow('Account not verified');
  });

  it('should throw an error if token generation fails', async () => {
    jest
      .spyOn(authMock.tokenServiceFake, 'generateToken')
      .mockRejectedValueOnce(
        AuthDomainError.internalServerError('Failure to generate token'),
      );

    const promise = loginUseCase.execute(payload);

    await expect(promise).rejects.toThrow('Failure to generate token');
  });
});
