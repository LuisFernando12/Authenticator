import {
  IQueryOauthLogin,
  LoginUseCase,
} from '@/oauth/application/use-case/login.use-case';
import { OauthDomainError } from '../../../../src/oauth/domain/error/oauth-domain.error';
import { oauthMocked, OauthMockedType } from './mock/index.mock';

describe('LoginUseCase', () => {
  let loginUseCase: LoginUseCase;
  let oauthMock: OauthMockedType;
  beforeEach(() => {
    oauthMock = oauthMocked();
    loginUseCase = new LoginUseCase(
      oauthMock.redisServiceFake,
      oauthMock.userServiceFake,
      oauthMock.consentServiceFake,
      oauthMock.generateIdServiceFake,
      oauthMock.securityEventFake,
      { generateOTP: () => 123456 } as any,
      { blockAccount: async () => undefined } as any,
      { findByUserId: async () => [] } as any,
    );
  });
  const payload = {
    email: 'john.doe@example.com',
    password: 'test-user-password',
    ip: '127.0.0.1',
    userAgent: 'test-user-agent',
  };
  const queryOauthLogin: IQueryOauthLogin = {
    oauthRequestId: 'test-oauth-request-id',
    responseType: 'code',
    clientId: 'test-client-id',
    redirectUri: 'https://example.com/callback',
    state: 'test-state',
    scope: 'read write',
    codeChallenge: 'test-code-challenge',
    codeChallengeMethod: 'sha256',
  };
  it('should be defined', () => {
    expect(loginUseCase).toBeDefined();
  });
  it('should execute the login use case successfully', async () => {
    const result = await loginUseCase.execute(payload, queryOauthLogin);
    expect(result).toBeInstanceOf(URL);
    expect(result.toString()).toBe(
      'https://example.com/callback?code=test-oauth-authorization-code&state=test-state',
    );
  });
  it('should throw an error if the oauth request is not found', async () => {
    jest
      .spyOn(oauthMock.redisServiceFake, 'consumeOauthRequest')
      .mockRejectedValueOnce(
        OauthDomainError.invalidGrant('Oauth Request ID not found'),
      );
    const promise = loginUseCase.execute(payload, queryOauthLogin);
    await expect(promise).rejects.toThrow('Oauth Request ID not found');
  });
  it('should throw an error to save the code on redis', async () => {
    jest
      .spyOn(oauthMock.redisServiceFake, 'saveOauthAuthorizationCode')
      .mockRejectedValueOnce(
        OauthDomainError.internalServerError('Failure to save code on redis'),
      );
    const promise = loginUseCase.execute(payload, queryOauthLogin);
    await expect(promise).rejects.toThrow('Failure to save code on redis');
  });
  it('should throw an error if the user credentials are invalid', async () => {
    jest
      .spyOn(oauthMock.userServiceFake, 'validateUserCredentials')
      .mockRejectedValueOnce(
        OauthDomainError.unauthorizedClient('Invalid credentials'),
      );
    const promise = loginUseCase.execute(payload, queryOauthLogin);
    await expect(promise).rejects.toThrow('Invalid credentials');
  });
});
