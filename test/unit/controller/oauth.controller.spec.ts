import { Test, TestingModule } from '@nestjs/testing';
import {
  IOauthController,
  OauthController,
} from '../../../src/controller/oauth.controller';
import { LoginDTO } from '../../../src/dto/login.dto';
import {
  OauthAuthorizeDTO,
  OauthRefreshTokenDTO,
  OauthTokenDTO,
} from '../../../src/dto/oauth-authorize.dto';
import { RevokeTokenDTO, TokenIntrospectDTO } from '../../../src/dto/token.dto';
import {
  IOauthService,
  OauthService,
} from '../../../src/service/oauth.service';
import { IResponseTokenIntrospect } from '../../../src/service/token.service';

describe('OauthController', () => {
  let oauthController: IOauthController;
  const mockOauthService: IOauthService = {
    authorize: jest.fn(),
    token: jest.fn(),
    login: jest.fn(),
    refreshToken: jest.fn(),
    revokeToken: jest.fn(),
    tokenIntrospect: jest.fn(),
  };
  const mockPayloadOauthAuthorize: Omit<OauthAuthorizeDTO, 'oauthRequestId'> = {
    responseType: 'code',
    clientId: '123',
    redirectUri: 'http://localhost:3000/callback',
    codeChallenge: 'challenge',
    codeChallengeMethod: 'method',
    state: 'state',
    scope: 'scope',
  };
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OauthController],
      providers: [
        {
          provide: OauthService,
          useValue: mockOauthService,
        },
      ],
    }).compile();
    oauthController = module.get<IOauthController>(OauthController);
  });
  it('should be defined', () => {
    expect(true).toBe(true);
  });
  describe('authorize', () => {
    it('should start authorize a user', async () => {
      mockOauthService.authorize = jest
        .fn()
        .mockResolvedValue('http://localhost:3000/oauth/authorize');
      const result = await oauthController.authorize(mockPayloadOauthAuthorize);
      expect(result).toEqual({
        url: 'http://localhost:3000/oauth/authorize',
        statusCode: 302,
      });
    });
  });
  describe('token', () => {
    const payloadOauthToken: OauthTokenDTO = {
      clientId: '123',
      codeVerifier: 'verifier',
      code: 'code',
      clientSecret: 'secret',
      redirectUri: 'http://localhost:3000/callback',
      grantType: 'authorization_code',
    };
    const date = new Date().toISOString();
    it('should return token to user', async () => {
      mockOauthService.token = jest.fn().mockResolvedValue({
        token_type: 'bearer',
        access_token: 'token',
        scope: 'scope',
        expiresAt: date,
      });
      const result = await oauthController.token(payloadOauthToken);
      expect(result).toEqual({
        token_type: 'bearer',
        access_token: 'token',
        scope: 'scope',
        expiresAt: date,
      });
    });
  });
  describe('login', () => {
    const mockPayloadOauthLogin: LoginDTO = {
      email: 'john.doe@example.com',
      password: 'strongPassword',
    };
    const mockQueryOauthLogin: OauthAuthorizeDTO = {
      ...mockPayloadOauthAuthorize,
      oauthRequestId: '123',
    };
    it('should login a user', async () => {
      mockOauthService.login = jest
        .fn()
        .mockResolvedValueOnce('http://frontend.com/oauth/callback');
      const result = await oauthController.login(
        mockPayloadOauthLogin,
        mockQueryOauthLogin,
      );
      expect(result).toEqual({
        url: 'http://frontend.com/oauth/callback',
        statusCode: 302,
      });
    });
  });
  describe('refreshToken', () => {
    const mockPayloadOauthRefreshToken: OauthRefreshTokenDTO = {
      refreshToken: 'refreshToken',
      grantType: 'refresh_token',
    };
    it('should refresh token', async () => {
      mockOauthService.refreshToken = jest.fn().mockResolvedValue({
        token_type: 'bearer',
        access_token: 'token',
        refresh_token: 'refreshToken',
        scope: 'scope',
        expiresAt: '2023-01-01T00:00:00.000Z',
      });
      const result = await oauthController.refreshToken(
        mockPayloadOauthRefreshToken,
      );
      expect(result).toEqual({
        token_type: 'bearer',
        access_token: 'token',
        refresh_token: 'refreshToken',
        scope: 'scope',
        expiresAt: '2023-01-01T00:00:00.000Z',
      });
    });
  });
  describe('revokeToken', () => {
    const mockPayloadRevokeToken: RevokeTokenDTO = {
      token: 'token',
    };
    it('should revoke token', async () => {
      mockOauthService.revokeToken = jest.fn().mockResolvedValue({
        message: 'Token revoked successfully',
      });
      const result = await oauthController.revokeToken(mockPayloadRevokeToken);
      expect(result).toEqual({
        message: 'Token revoked successfully',
      });
    });
  });
  describe('tokenIntrospect', () => {
    const mockPayloadTokenIntrospect: TokenIntrospectDTO = {
      token: 'token',
    };
    const mockResponseTokenIntrospect: IResponseTokenIntrospect = {
      active: true,
      sub: 'sub-01',
      client_id: 'clioentId-01',
      scope: 'scope1 scope2',
      exp: 2,
      iat: 1,
    };
    it('should introspect token', async () => {
      mockOauthService.tokenIntrospect = jest
        .fn()
        .mockResolvedValue(mockResponseTokenIntrospect);

      const result = await oauthController.tokenIntrospect(
        mockPayloadTokenIntrospect,
      );
      expect(result).toEqual(mockResponseTokenIntrospect);
    });
  });
});
