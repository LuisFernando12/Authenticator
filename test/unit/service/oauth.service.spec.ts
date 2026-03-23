import { InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { createHash } from 'crypto';
import { OauthError } from '../../../src/config/errors/oauth.error';
import { AuthLogger } from '../../../src/config/logger/auth-logger.config';
import { BaseLogger } from '../../../src/config/logger/base-logger';
import { LoginDTO } from '../../../src/dto/login.dto';
import {
  OauthAuthorizeDTO,
  OauthRefreshTokenDTO,
  OauthTokenDTO,
} from '../../../src/dto/oauth-authorize.dto';
import { AppConfigEnvService } from '../../../src/service/app-config-env.service';
import { ClientService } from '../../../src/service/client.service';
import {
  IOauthService,
  OauthService,
} from '../../../src/service/oauth.service';
import { RedisService } from '../../../src/service/redis.service';
import { TokenService } from '../../../src/service/token.service';
import { UserClientConsentService } from '../../../src/service/user-client-consent.service';
import { UserService } from '../../../src/service/user.service';
import { mockAppconfigEnvService } from '../mock/appConfigEnv.mock';
import { mockClientService } from '../mock/client.mock';
import { mockAuthLogger, mockBaseLogger } from '../mock/logger.mock';
import { mockRedisService } from '../mock/redis.mock';
import { mockTokenService } from '../mock/token.mock';
import { mockUserService } from '../mock/user.mock';
import { mockUserClientConsentService } from '../mock/userClient.mock';
import { IPayloadAuthRequest } from './../../../src/service/oauth.service';

describe('OauthService', () => {
  let oauthService: IOauthService;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OauthService,
        {
          provide: AuthLogger,
          useValue: mockAuthLogger,
        },
        { provide: BaseLogger, useValue: mockBaseLogger },
        {
          provide: ClientService,
          useValue: mockClientService,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
        {
          provide: AppConfigEnvService,
          useValue: mockAppconfigEnvService,
        },
        {
          provide: UserClientConsentService,
          useValue: mockUserClientConsentService,
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: TokenService,
          useValue: mockTokenService,
        },
      ],
    }).compile();
    oauthService = module.get<OauthService>(OauthService);
  });
  it('should be defined', () => {
    expect(oauthService).toBeDefined();
  });
  describe('authorize', () => {
    const payloadOauth: OauthAuthorizeDTO = {
      responseType: 'code',
      clientId: 'client-id',
      codeChallenge: 'code-challenge',
      codeChallengeMethod: 'sha256',
      redirectUri: 'http://localhost:3000/callback',
      state: 'state',
      scope: 'scope 1 scope 2',
      oauthRequestId: 'oauth-request-id',
    };
    const mockClient = {
      clientId: 'client-id',
      clientSecret: 'client-secret',
      redirectUris: ['http://localhost:3000/callback'],
      isConfidential: false,
    };
    it('should authorize user', async () => {
      mockClientService.findByClientId = jest
        .fn()
        .mockResolvedValueOnce(mockClient);
      mockRedisService.set = jest.fn().mockResolvedValueOnce(true);
      const result = await oauthService.authorize(payloadOauth);
      expect(result).toBeInstanceOf(URL);
    });
    it('should throw an error to authorize missing code challenge method ', async () => {
      payloadOauth.codeChallengeMethod = undefined;
      const promise = oauthService.authorize(payloadOauth);
      await expect(promise).rejects.toThrow(OauthError);
      await expect(promise).rejects.toThrow(
        'Code challenge and code challenge method are required together',
      );
    });
    it('should throw an error to authorize missing code challenge', async () => {
      payloadOauth.codeChallengeMethod = 'sha256';
      payloadOauth.codeChallenge = undefined;
      const promise = oauthService.authorize(payloadOauth);
      await expect(promise).rejects.toThrow(OauthError);
      await expect(promise).rejects.toThrow(
        'Code challenge and code challenge method are required together',
      );
    });
    it('should throw an error to authorize code challenge method not supported', async () => {
      payloadOauth.codeChallengeMethod = 'md5';
      payloadOauth.codeChallenge = 'code-challenge';
      const promise = oauthService.authorize(payloadOauth);
      await expect(promise).rejects.toThrow(OauthError);
      await expect(promise).rejects.toThrow(
        'Code challenge method not supported',
      );
    });
    it('should throw an error to authorize client id not found', async () => {
      payloadOauth.codeChallengeMethod = 'sha256';
      mockClientService.findByClientId = jest.fn().mockResolvedValueOnce(null);
      const promise = oauthService.authorize(payloadOauth);
      await expect(promise).rejects.toThrow(OauthError);
      await expect(promise).rejects.toThrow('ClientID authentication failed');
    });
    it('should throw an error to authorize redirect uri not found', async () => {
      payloadOauth.redirectUri = 'http://localhost:3000/callback2';
      mockClientService.findByClientId = jest
        .fn()
        .mockResolvedValueOnce(mockClient);
      const promise = oauthService.authorize(payloadOauth);
      await expect(promise).rejects.toThrow(OauthError);
      await expect(promise).rejects.toThrow('Redirect URI not found');
    });
    it('should throw an error to authorize code challenge is required', async () => {
      payloadOauth.redirectUri = 'http://localhost:3000/callback';
      payloadOauth.codeChallenge = undefined;
      payloadOauth.codeChallengeMethod = undefined;
      mockClientService.findByClientId = jest
        .fn()
        .mockResolvedValueOnce(mockClient);
      const promise = oauthService.authorize(payloadOauth);
      await expect(promise).rejects.toThrow(OauthError);
      await expect(promise).rejects.toThrow('Code challenge is required');
    });
    it('should throw an error to save authRequest on redis', async () => {
      payloadOauth.codeChallenge = 'code-challenge';
      payloadOauth.codeChallengeMethod = 'sha256';
      mockClientService.findByClientId = jest
        .fn()
        .mockResolvedValueOnce(mockClient);
      mockRedisService.set = jest.fn().mockResolvedValueOnce(false);
      const promise = oauthService.authorize(payloadOauth);
      await expect(promise).rejects.toThrow(InternalServerErrorException);
      await expect(promise).rejects.toThrow(
        'Failure to save authRequest on redis',
      );
    });
  });
  describe('token', () => {
    const payloadOauthToken: OauthTokenDTO = {
      grantType: 'authorization_code',
      clientId: 'client-id',
      codeVerifier: null,
      code: 'code',
      clientSecret: 'client-secret',
      redirectUri: 'http://localhost:3000/callback',
    };
    const mockClient = {
      clientId: 'client-id',
      clientSecret: 'client-secret',
      redirectUris: ['http://localhost:3000/callback'],
      isConfidential: false,
    };
    const mockUser = {
      id: 'id-1',
      name: 'John Doe',
      email: 'john.doe@example.com',
      password: 'password123',
      isVerified: true,
    };
    const mockCode = JSON.stringify({
      code: 'code',
      userEmail: 'email',
      scope: 'scope',
      clientId: 'client-id',
      redirectUri: 'http://localhost:3000/callback',
    });
    const mockToken = {
      access_token: 'access_token',
      expiresAt: 'expiresAt',
    };
    const mockTokenResponse = {
      token_type: 'Bearer',
      access_token: 'access_token',
      scope: 'scope',
      expiresAt: 'expiresAt',
    };
    it('should retrun a token to authorization code flow', async () => {
      mockClient.isConfidential = true;
      mockClientService.findByClientId = jest
        .fn()
        .mockResolvedValueOnce(mockClient);
      mockRedisService.getdel = jest.fn().mockResolvedValueOnce(mockCode);
      mockTokenService.generateToken = jest
        .fn()
        .mockResolvedValueOnce(mockToken);
      mockUserService.findByEmail = jest.fn().mockResolvedValueOnce(mockUser);
      const result = await oauthService.token(payloadOauthToken);
      expect(result).toEqual(mockTokenResponse);
    });
    it('should return a token to PKCE flow', async () => {
      payloadOauthToken.codeVerifier = 'code-verifier';
      mockClient.isConfidential = false;
      const hashCodeVerifier = createHash('sha256')
        .update('code-verifier')
        .digest('base64url');
      mockClientService.findByClientId = jest
        .fn()
        .mockResolvedValueOnce(mockClient);
      const { ...codeJSON } = JSON.parse(mockCode);
      codeJSON['codeChallenge'] = hashCodeVerifier;
      codeJSON['codeChallengeMethod'] = 'sha256';
      jest
        .spyOn(mockRedisService, 'getdel')
        .mockResolvedValueOnce(JSON.stringify(codeJSON));

      mockTokenService.generateToken = jest
        .fn()
        .mockResolvedValueOnce(mockToken);
      mockUserService.findByEmail = jest.fn().mockResolvedValueOnce(mockUser);
      const result = await oauthService.token(payloadOauthToken);
      expect(result).toEqual(mockTokenResponse);
    });
    it('should throw an error to client secret or code verifier is required', async () => {
      payloadOauthToken.clientSecret = undefined;
      payloadOauthToken.codeVerifier = undefined;
      const promise = oauthService.token(payloadOauthToken);
      await expect(promise).rejects.toThrow(OauthError);
      await expect(promise).rejects.toThrow(
        'Client secret or code verifier is required',
      );
    });
    it('should throw an error to client id not found', async () => {
      payloadOauthToken.codeVerifier = 'code-verifier';
      mockClientService.findByClientId = jest.fn().mockResolvedValueOnce(null);
      const promise = oauthService.token(payloadOauthToken);
      await expect(promise).rejects.toThrow(OauthError);
      await expect(promise).rejects.toThrow('ClientID not found');
    });
    it('should throw an error to Client secret is required', async () => {
      mockClient.isConfidential = true;
      payloadOauthToken.clientSecret = null;
      mockClientService.findByClientId = jest
        .fn()
        .mockResolvedValueOnce(mockClient);
      const promise = oauthService.token(payloadOauthToken);
      await expect(promise).rejects.toThrow(OauthError);
      await expect(promise).rejects.toThrow('Client secret is required');
    });
    it('should throw an  error to code verifier is required', async () => {
      mockClient.isConfidential = false;
      payloadOauthToken.clientSecret = 'client-secret';
      payloadOauthToken.codeVerifier = null;
      mockClientService.findByClientId = jest
        .fn()
        .mockResolvedValueOnce(mockClient);
      const promise = oauthService.token(payloadOauthToken);
      await expect(promise).rejects.toThrow(OauthError);
      await expect(promise).rejects.toThrow('Code verifier is required');
    });
    it('should throw an error to invalid client secret', async () => {
      mockClient.isConfidential = true;
      payloadOauthToken.clientSecret = 'invalid-client-secret';
      mockClientService.findByClientId = jest
        .fn()
        .mockResolvedValueOnce(mockClient);
      const promise = oauthService.token(payloadOauthToken);
      await expect(promise).rejects.toThrow(OauthError);
      await expect(promise).rejects.toThrow('Invalid client secret');
    });
    it('should throw an error to invalid redirect uri', async () => {
      payloadOauthToken.clientSecret = 'client-secret';
      payloadOauthToken.redirectUri = 'http://localhost:3000/callback2';
      mockClientService.findByClientId = jest
        .fn()
        .mockResolvedValueOnce(mockClient);
      const promise = oauthService.token(payloadOauthToken);
      await expect(promise).rejects.toThrow(OauthError);
      await expect(promise).rejects.toThrow('Invalid redirect URI');
    });
    it('should throw an error to code challenge method not supported', async () => {
      payloadOauthToken.codeVerifier = 'code-verifier';
      payloadOauthToken.redirectUri = 'http://localhost:3000/callback';
      const hashCodeVerifier = createHash('sha256')
        .update('code-verifier')
        .digest('base64url');
      mockClientService.findByClientId = jest
        .fn()
        .mockResolvedValueOnce(mockClient);
      const { ...codeJSON } = JSON.parse(mockCode);
      codeJSON['codeChallenge'] = hashCodeVerifier;
      codeJSON['codeChallengeMethod'] = 'md5';
      jest
        .spyOn(mockRedisService, 'getdel')
        .mockResolvedValueOnce(JSON.stringify(codeJSON));

      const promise = oauthService.token(payloadOauthToken);
      await expect(promise).rejects.toThrow(OauthError);
      await expect(promise).rejects.toThrow('Invalid code challenge method');
    });
    it('should throw an error to code challenge is invalid or expired', async () => {
      payloadOauthToken.redirectUri = 'http://localhost:3000/callback';
      payloadOauthToken.codeVerifier = 'code-verifier';
      payloadOauthToken.grantType = 'authorization_code';
      mockClientService.findByClientId = jest
        .fn()
        .mockResolvedValueOnce(mockClient);
      mockRedisService.getdel = jest.fn().mockResolvedValueOnce(false);
      const promise = oauthService.token(payloadOauthToken);
      await expect(promise).rejects.toThrow(OauthError);
      await expect(promise).rejects.toThrow('Invalid code challenge');
    });
    it('should throw an error to Invalid code verifier', async () => {
      mockClientService.findByClientId = jest
        .fn()
        .mockResolvedValueOnce(mockClient);
      payloadOauthToken.codeVerifier = 'invalid-code-verifier';
      const { ...codeJSON } = JSON.parse(mockCode);
      codeJSON['codeChallenge'] = 'code-challenge';
      codeJSON['codeChallengeMethod'] = 'sha256';
      mockRedisService.getdel = jest
        .fn()
        .mockResolvedValueOnce(JSON.stringify(codeJSON));
      const promise = oauthService.token(payloadOauthToken);
      await expect(promise).rejects.toThrow(OauthError);
      await expect(promise).rejects.toThrow('Invalid code verifier');
    });
    it('should throw an error to authorization code is invalid or expired', async () => {
      payloadOauthToken.codeVerifier = null;
      payloadOauthToken.code = 'invalid-code';
      mockClientService.findByClientId = jest
        .fn()
        .mockResolvedValueOnce(mockClient);
      mockRedisService.getdel = jest.fn().mockResolvedValueOnce(mockCode);
      const promise = oauthService.token(payloadOauthToken);
      await expect(promise).rejects.toThrow(OauthError);
      await expect(promise).rejects.toThrow(
        'Authorization code is invalid or expired',
      );
    });
    it('should throw an error to invalid client id', async () => {
      payloadOauthToken.code = 'code';
      payloadOauthToken.clientId = 'invalid-client';
      mockClientService.findByClientId = jest
        .fn()
        .mockResolvedValueOnce(mockClient);
      mockRedisService.getdel = jest.fn().mockResolvedValueOnce(mockCode);
      const promise = oauthService.token(payloadOauthToken);
      await expect(promise).rejects.toThrow(OauthError);
      await expect(promise).rejects.toThrow('Invalid client ID');
    });
    it('should thrown an error to invalid redirect uri', async () => {
      //
      payloadOauthToken.clientId = 'client-id';
      payloadOauthToken.redirectUri = 'http://localhost:3000/callback';
      mockClientService.findByClientId = jest
        .fn()
        .mockResolvedValueOnce(mockClient);
      const { redirectURI: _, ...selfCode } = JSON.parse(mockCode);
      selfCode['redirectUri'] = 'http://localhost:3000/callback2';

      mockRedisService.getdel = jest
        .fn()
        .mockResolvedValueOnce(JSON.stringify(selfCode));
      const promise = oauthService.token(payloadOauthToken);
      await expect(promise).rejects.toThrow(OauthError);
      await expect(promise).rejects.toThrow('Invalid redirect URI');
    });
    it('should  throw an error to invalid user ', async () => {
      payloadOauthToken.redirectUri = 'http://localhost:3000/callback';
      mockRedisService.getdel = jest.fn().mockResolvedValueOnce(mockCode);
      mockClientService.findByClientId = jest
        .fn()
        .mockResolvedValueOnce(mockClient);
      mockUserService.findByEmail = jest.fn().mockResolvedValueOnce(null);
      const promise = oauthService.token(payloadOauthToken);
      await expect(promise).rejects.toThrow(OauthError);
      await expect(promise).rejects.toThrow('Invalid credentials');
    });
    it('should throw an error to generate token', async () => {
      mockClientService.findByClientId = jest
        .fn()
        .mockResolvedValueOnce(mockClient);
      mockUserService.findByEmail = jest.fn().mockResolvedValueOnce(mockUser);
      mockRedisService.getdel = jest.fn().mockResolvedValueOnce(mockCode);
      mockTokenService.generateToken = jest.fn().mockResolvedValueOnce(null);
      const promise = oauthService.token(payloadOauthToken);
      await expect(promise).rejects.toThrow(InternalServerErrorException);
      await expect(promise).rejects.toThrow('Failure to generate token');
    });
    it('should throw an error to unsupported grant type undefined', async () => {
      payloadOauthToken.grantType = undefined;
      mockClientService.findByClientId = jest
        .fn()
        .mockResolvedValueOnce(mockClient);
      const promise = oauthService.token(payloadOauthToken);
      await expect(promise).rejects.toThrow(OauthError);
      await expect(promise).rejects.toThrow('Unsupported grant type');
    });
    it('should throw an error to unsupported grant type', async () => {
      payloadOauthToken.grantType = 'invalid-grant-type';
      mockClientService.findByClientId = jest
        .fn()
        .mockResolvedValueOnce(mockClient);
      const promise = oauthService.token(payloadOauthToken);
      await expect(promise).rejects.toThrow(OauthError);
      await expect(promise).rejects.toThrow(
        'Unsupported grant type invalid-grant-type',
      );
    });
  });
  describe('login', () => {
    const payloadOauthLogin: LoginDTO = {
      email: 'email',
      password: 'password123',
    };
    const queryOauthLogin: OauthAuthorizeDTO = {
      responseType: 'code',
      clientId: 'client-id',
      codeChallenge: 'code-challenge',
      codeChallengeMethod: 'sha256',
      redirectUri: 'http://localhost:3000/callback',
      state: 'state',
      scope: 'scope 1 scope 2',
      oauthRequestId: 'oauth-request-id',
    };
    const mockClient = {
      clientId: 'client-id',
      clientSecret: 'client-secret',
      redirectUris: ['http://localhost:3000/callback'],
      isConfidential: false,
    };
    const mockUser = {
      id: 'id-1',
      name: 'John Doe',
      email: 'john.doe@example.com',
      password: bcrypt.hashSync('password123', bcrypt.genSaltSync()),
      isVerified: true,
    };
    const mockPayloadOuthRequest: IPayloadAuthRequest = {
      clientId: 'client-id',
      redirectUri: 'http://localhost:3000/callback',
      codeChallenge: 'code-challenge',
      codeChallengeMethod: 'sha256',
      state: 'state',
      scope: 'scope 1 scope 2',
    };
    it('should login user Authorization code flow', async () => {
      const {
        codeChallenge: _codeChallengeOauthRequest,
        codeChallengeMethod: _codeChallengeMethodOauthRequest,
        ...selfPayloadOauthRequest
      } = mockPayloadOuthRequest;
      mockRedisService.getdel = jest
        .fn()
        .mockResolvedValueOnce(JSON.stringify(selfPayloadOauthRequest));

      mockClient.isConfidential = true;
      const {
        codeChallenge: _codeChallengeQueryOauthLogin,
        codeChallengeMethod: _codeChallengeMethodQueryOauthLogin,
        ...selfQueryOauthLogin
      } = queryOauthLogin;
      mockClientService.findByClientId = jest
        .fn()
        .mockResolvedValueOnce(mockClient);

      mockUserService.findByEmail = jest.fn().mockResolvedValueOnce(mockUser);

      jest.spyOn(mockRedisService, 'set').mockResolvedValueOnce('code');
      mockUserClientConsentService.create = jest
        .fn()
        .mockResolvedValueOnce(true);
      const result = await oauthService.login(
        payloadOauthLogin,
        selfQueryOauthLogin,
      );
      expect(result).toBeInstanceOf(URL);
    });
    it('should login user PKCE flow', async () => {
      mockClientService.findByClientId = jest
        .fn()
        .mockResolvedValueOnce(mockClient);
      mockUserService.findByEmail = jest.fn().mockResolvedValueOnce(mockUser);
      mockRedisService.getdel = jest
        .fn()
        .mockResolvedValueOnce(JSON.stringify(mockPayloadOuthRequest));
      jest
        .spyOn(mockRedisService, 'set')
        .mockResolvedValueOnce('code')
        .mockResolvedValueOnce('code-challenge')
        .mockResolvedValueOnce('code-challenge-method');
      mockUserClientConsentService.create = jest
        .fn()
        .mockResolvedValueOnce(true);
      const result = await oauthService.login(
        payloadOauthLogin,
        queryOauthLogin,
      );
      expect(result).toBeInstanceOf(URL);
    });
    it('should throw an error to code challenge and code challenge method required together', async () => {
      queryOauthLogin.codeChallengeMethod = 'sha256';
      queryOauthLogin.codeChallenge = undefined;
      const promise = oauthService.login(payloadOauthLogin, queryOauthLogin);
      await expect(promise).rejects.toThrow(OauthError);
      await expect(promise).rejects.toThrow(
        'Code challenge and code challenge method are required together',
      );
    });
    it('should throw an error to undefined payload oauth request on redis', async () => {
      queryOauthLogin.codeChallenge = 'code-chalenge';
      mockRedisService.getdel = jest.fn().mockResolvedValueOnce(null);
      const promise = oauthService.login(payloadOauthLogin, queryOauthLogin);
      await expect(promise).rejects.toThrow(OauthError);
      await expect(promise).rejects.toThrow('Oauth Request ID not found');
    });
    it('should throw an error to clientID of queryLogin mismatch with clientID of oauth request on redis', async () => {
      mockRedisService.getdel = jest.fn().mockResolvedValueOnce(
        JSON.stringify({
          ...mockPayloadOuthRequest,
          clientId: 'invalid-client-id',
        }),
      );
      const promise = oauthService.login(payloadOauthLogin, queryOauthLogin);
      await expect(promise).rejects.toThrow(OauthError);
      await expect(promise).rejects.toThrow('Invalid client ID');
    });
    it('should throw an error to redirect uri of queryLogin mismatch with redirect uri of oauth request on redis', async () => {
      mockRedisService.getdel = jest.fn().mockResolvedValueOnce(
        JSON.stringify({
          ...mockPayloadOuthRequest,
          redirectUri: 'invalid-redirect-uri',
        }),
      );
      const promise = oauthService.login(payloadOauthLogin, queryOauthLogin);
      await expect(promise).rejects.toThrow(OauthError);
      await expect(promise).rejects.toThrow('Invalid redirect URI');
    });
    it('should throw an error to state of queryLogin mismatch with state of oauth request on redis', async () => {
      mockRedisService.getdel = jest.fn().mockResolvedValueOnce(
        JSON.stringify({
          ...mockPayloadOuthRequest,
          state: 'invalid-state',
        }),
      );
      const promise = oauthService.login(payloadOauthLogin, queryOauthLogin);
      await expect(promise).rejects.toThrow(OauthError);
      await expect(promise).rejects.toThrow('Invalid state');
    });
    it('should throw an error to scope of queryLogin mismatch with scope of oauth request on redis', async () => {
      mockRedisService.getdel = jest.fn().mockResolvedValueOnce(
        JSON.stringify({
          ...mockPayloadOuthRequest,
          scope: 'invalid-scope',
        }),
      );
      const promise = oauthService.login(payloadOauthLogin, queryOauthLogin);
      await expect(promise).rejects.toThrow(OauthError);
      await expect(promise).rejects.toThrow('Invalid scope');
    });
    it('should throw an error to code challenge is required', async () => {
      mockPayloadOuthRequest.codeChallenge = 'code-challenge';
      mockPayloadOuthRequest.codeChallengeMethod = 'sha256';
      mockRedisService.getdel = jest
        .fn()
        .mockResolvedValueOnce(JSON.stringify(mockPayloadOuthRequest));

      queryOauthLogin.codeChallenge = undefined;
      queryOauthLogin.codeChallengeMethod = undefined;

      const promise = oauthService.login(payloadOauthLogin, queryOauthLogin);

      await expect(promise).rejects.toThrow(OauthError);
      await expect(promise).rejects.toThrow('Code challenge is required');
    });
    it('should throw an error to code challenge method of queryLogin mismatch with code challenge method of oauth request on redis', async () => {
      queryOauthLogin.codeChallengeMethod = 'md5';
      queryOauthLogin.codeChallenge = 'code-challenge';
      mockRedisService.getdel = jest.fn().mockResolvedValueOnce(
        JSON.stringify({
          ...mockPayloadOuthRequest,
          codeChallengeMethod: 'sha256',
        }),
      );
      const promise = oauthService.login(payloadOauthLogin, queryOauthLogin);
      await expect(promise).rejects.toThrow(OauthError);
      await expect(promise).rejects.toThrow('Invalid code challenge method');
    });
    it('should throw an error to code challenge of queryLogin mismatch with code challenge of oauth request on redis', async () => {
      queryOauthLogin.codeChallengeMethod = 'sha256';
      queryOauthLogin.codeChallenge = 'code-challenge';
      mockRedisService.getdel = jest.fn().mockResolvedValueOnce(
        JSON.stringify({
          ...mockPayloadOuthRequest,
          codeChallenge: 'invalid-code-challenge',
        }),
      );
      const promise = oauthService.login(payloadOauthLogin, queryOauthLogin);
      await expect(promise).rejects.toThrow(OauthError);
      await expect(promise).rejects.toThrow('Invalid code challenge');
    });
    it('should throw an error to client id not found', async () => {
      queryOauthLogin.codeChallenge = 'code-challenge';
      queryOauthLogin.clientId = 'invalid-client-id';
      mockClientService.findByClientId = jest.fn().mockResolvedValueOnce(null);
      mockPayloadOuthRequest.clientId = 'invalid-client-id';
      mockRedisService.getdel = jest
        .fn()
        .mockResolvedValueOnce(JSON.stringify(mockPayloadOuthRequest));
      const promise = oauthService.login(payloadOauthLogin, queryOauthLogin);
      await expect(promise).rejects.toThrow(OauthError);
      await expect(promise).rejects.toThrow('ClientID not found');
    });
    it('should throw an error to redirect uri not found', async () => {
      mockRedisService.getdel = jest
        .fn()
        .mockResolvedValueOnce(JSON.stringify(mockPayloadOuthRequest));
      mockClient.redirectUris = ['http://localhost:3000/callback2'];
      mockClientService.findByClientId = jest
        .fn()
        .mockResolvedValueOnce(mockClient);

      const promise = oauthService.login(payloadOauthLogin, queryOauthLogin);
      await expect(promise).rejects.toThrow(OauthError);
      await expect(promise).rejects.toThrow('Redirect URI not found');
    });
    it('should throw an error to invalid credentials', async () => {
      mockRedisService.getdel = jest
        .fn()
        .mockResolvedValueOnce(JSON.stringify(mockPayloadOuthRequest));
      mockClient.redirectUris = ['http://localhost:3000/callback'];
      mockClientService.findByClientId = jest
        .fn()
        .mockResolvedValueOnce(mockClient);
      mockUserService.findByEmail = jest.fn().mockResolvedValueOnce(null);

      const promise = oauthService.login(payloadOauthLogin, queryOauthLogin);
      await expect(promise).rejects.toThrow(OauthError);
      await expect(promise).rejects.toThrow('Invalid credentials');
    });
    it('should throw an error to invalid credentials on password mismatached', async () => {
      mockRedisService.getdel = jest
        .fn()
        .mockResolvedValueOnce(JSON.stringify(mockPayloadOuthRequest));
      mockClientService.findByClientId = jest
        .fn()
        .mockResolvedValueOnce(mockClient);
      mockUserService.findByEmail = jest.fn().mockResolvedValueOnce(mockUser);
      payloadOauthLogin.password = 'invalid-password';

      const promise = oauthService.login(payloadOauthLogin, queryOauthLogin);
      await expect(promise).rejects.toThrow(OauthError);
      await expect(promise).rejects.toThrow('Invalid credentials');
    });
    it('should throw an error to user not verified', async () => {
      mockUser.isVerified = false;
      mockRedisService.getdel = jest
        .fn()
        .mockResolvedValueOnce(JSON.stringify(mockPayloadOuthRequest));
      mockClientService.findByClientId = jest
        .fn()
        .mockResolvedValueOnce(mockClient);
      mockUserService.findByEmail = jest.fn().mockResolvedValueOnce(mockUser);
      payloadOauthLogin.password = 'password123';

      const promise = oauthService.login(payloadOauthLogin, queryOauthLogin);
      await expect(promise).rejects.toThrow(OauthError);
      await expect(promise).rejects.toThrow(
        'Please verify your email and active your account',
      );
    });
    it('should throw an error to save code on redis', async () => {
      mockUser.isVerified = true;
      mockRedisService.getdel = jest
        .fn()
        .mockResolvedValueOnce(JSON.stringify(mockPayloadOuthRequest));
      mockClientService.findByClientId = jest
        .fn()
        .mockResolvedValueOnce(mockClient);
      mockUserService.findByEmail = jest.fn().mockResolvedValueOnce(mockUser);
      mockRedisService.set = jest.fn().mockResolvedValueOnce(false);
      const promise = oauthService.login(payloadOauthLogin, queryOauthLogin);
      await expect(promise).rejects.toThrow(InternalServerErrorException);
      await expect(promise).rejects.toThrow('Failure to save code on redis');
    });
    it('should throw an error to code challenge method not supported', async () => {
      mockPayloadOuthRequest.codeChallengeMethod = 'md5';
      mockRedisService.getdel = jest
        .fn()
        .mockResolvedValueOnce(JSON.stringify(mockPayloadOuthRequest));
      mockClientService.findByClientId = jest
        .fn()
        .mockResolvedValueOnce(mockClient);
      mockUserService.findByEmail = jest.fn().mockResolvedValueOnce(mockUser);
      mockRedisService.set = jest.fn().mockResolvedValueOnce(true);
      queryOauthLogin.codeChallengeMethod = 'md5';
      const promise = oauthService.login(payloadOauthLogin, queryOauthLogin);
      await expect(promise).rejects.toThrow(OauthError);
      await expect(promise).rejects.toThrow(
        'Code challenge method not supported',
      );
    });
    it('should throw an error to user consent to client', async () => {
      mockPayloadOuthRequest.codeChallengeMethod = 'sha256';
      mockRedisService.getdel = jest
        .fn()
        .mockResolvedValueOnce(JSON.stringify(mockPayloadOuthRequest));
      mockUserClientConsentService.create = jest
        .fn()
        .mockResolvedValueOnce(null);
      mockClientService.findByClientId = jest
        .fn()
        .mockResolvedValueOnce(mockClient);
      mockUserService.findByEmail = jest.fn().mockResolvedValueOnce(mockUser);
      jest
        .spyOn(mockRedisService, 'set')
        .mockResolvedValueOnce('code')
        .mockResolvedValueOnce('code-challenge')
        .mockResolvedValueOnce('code-challenge-method');
      queryOauthLogin.codeChallengeMethod = 'sha256';
      const promise = oauthService.login(payloadOauthLogin, queryOauthLogin);
      await expect(promise).rejects.toThrow(OauthError);
      await expect(promise).rejects.toThrow(
        'Failure to user consent to client',
      );
    });
  });
  describe('refreshToken', () => {
    const mockUser = {
      id: 'id-1',
      name: 'John Doe',
      email: 'john.doe@example.com',
    };
    const payloadOauthRefreshToken: OauthRefreshTokenDTO = {
      refreshToken: 'refresh-token',
      grantType: 'refresh_token',
    };
    it('should refresh token', async () => {
      mockTokenService.verifyToken = jest.fn().mockResolvedValueOnce({
        username: 'john.doe@example.com',
        aud: 'client-id',
        scope: 'scope 1 scope 2',
      });
      mockUserService.findByEmail = jest.fn().mockResolvedValueOnce(mockUser);
      mockUserClientConsentService.findByUserIdAndClientId = jest
        .fn()
        .mockResolvedValueOnce(true);
      mockTokenService.refreshToken = jest.fn().mockResolvedValueOnce({
        token_type: 'Bearer',
        access_token: 'access_token',
        refresh_token: 'refresh_token',
        expiresAt: 'expiresAt',
      });
      const result = await oauthService.refreshToken(payloadOauthRefreshToken);
      expect(result).toEqual({
        access_token: 'access_token',
        refresh_token: 'refresh_token',
        expiresAt: 'expiresAt',
        token_type: 'Bearer',
      });
    });
    it('should throw an error to invalid grant type', async () => {
      payloadOauthRefreshToken.grantType = 'invalid-grant-type';
      const promise = oauthService.refreshToken(payloadOauthRefreshToken);
      await expect(promise).rejects.toThrow(OauthError);
      await expect(promise).rejects.toThrow('Invalid grant type');
      payloadOauthRefreshToken.grantType = undefined;
      const anotherPromise = oauthService.refreshToken(
        payloadOauthRefreshToken,
      );
      await expect(anotherPromise).rejects.toThrow(OauthError);
      await expect(anotherPromise).rejects.toThrow('Invalid grant type');
    });
    it('should throw an error to invalid refresh token', async () => {
      payloadOauthRefreshToken.grantType = 'refresh_token';
      mockTokenService.verifyToken = jest.fn().mockResolvedValueOnce(null);
      const promise = oauthService.refreshToken(payloadOauthRefreshToken);
      await expect(promise).rejects.toThrow(OauthError);
      await expect(promise).rejects.toThrow('Invalid refresh token');
    });
    it('should throw an error to refresh token expired', async () => {
      mockTokenService.verifyToken = jest
        .fn()
        .mockResolvedValueOnce({ exp: 1773797907 });
      const promise = oauthService.refreshToken(payloadOauthRefreshToken);
      await expect(promise).rejects.toThrow(OauthError);
      await expect(promise).rejects.toThrow('Refresh token expired');
    });
    it('should throw an error to invalid credentials', async () => {
      mockTokenService.verifyToken = jest.fn().mockResolvedValueOnce({
        username: 'john.doe@example.com',
        aud: 'client-id',
        scope: 'scope 1 scope 2',
      });
      mockUserService.findByEmail = jest.fn().mockResolvedValueOnce(null);
      const promise = oauthService.refreshToken(payloadOauthRefreshToken);
      await expect(promise).rejects.toThrow(OauthError);
      await expect(promise).rejects.toThrow('Invalid credentials');
    });
    it('should throw an error to user consent to client', async () => {
      mockTokenService.verifyToken = jest.fn().mockResolvedValueOnce({
        username: 'john.doe@example.com',
        aud: 'client-id',
        scope: 'scope 1 scope 2',
      });
      mockUserService.findByEmail = jest.fn().mockResolvedValueOnce(mockUser);
      mockUserClientConsentService.findByUserIdAndClientId = jest
        .fn()
        .mockResolvedValueOnce(null);
      const promise = oauthService.refreshToken(payloadOauthRefreshToken);
      await expect(promise).rejects.toThrow(OauthError);
      await expect(promise).rejects.toThrow('Invalid client ID');
    });
    it('should throw an error to generate token', async () => {
      mockTokenService.verifyToken = jest.fn().mockResolvedValueOnce({
        username: 'john.doe@example.com',
        aud: 'client-id',
        scope: 'scope 1 scope 2',
      });
      mockUserService.findByEmail = jest.fn().mockResolvedValueOnce(mockUser);
      mockUserClientConsentService.findByUserIdAndClientId = jest
        .fn()
        .mockResolvedValueOnce(true);
      mockTokenService.generateToken = jest.fn().mockResolvedValueOnce(null);
      const promise = oauthService.refreshToken(payloadOauthRefreshToken);
      await expect(promise).rejects.toThrow(InternalServerErrorException);
      await expect(promise).rejects.toThrow('Failure to generate token');
    });
  });
  describe('revokeToken', () => {
    const mockResultRevokeTokenSevice = {
      affected: 1,
      accessToken: 'accessToken',
    };
    const mockTokenVerified = {
      sub: 'sub-01',
      username: 'jhondoe@example.com',
      scope: 'scope 1 scope 2',
      aud: 'client-id',
      iss: 'example.api.com',
      iat: 1,
      exp: Math.floor(Date.now() / 1000 + 1293899),
    };
    it('should revoke token', async () => {
      mockTokenService.verifyToken = jest
        .fn()
        .mockResolvedValueOnce(mockTokenVerified);
      mockTokenService.revokeToken = jest
        .fn()
        .mockResolvedValueOnce(mockResultRevokeTokenSevice);
      mockTokenService.decodeToken = jest
        .fn()
        .mockResolvedValueOnce(mockTokenVerified);
      mockRedisService.set = jest.fn().mockResolvedValueOnce('OK');
      const result = await oauthService.revokeToken('token');
      expect(result).toEqual({ message: 'Token revoked successfully' });
    });
    it('should throw an error to invalid token', async () => {
      mockTokenService.verifyToken = jest.fn().mockResolvedValueOnce(null);
      const promise = oauthService.revokeToken('token');
      await expect(promise).rejects.toThrow(OauthError);
      await expect(promise).rejects.toThrow('Invalid token');
    });
    it('should throw an error to token expired', async () => {
      mockTokenService.verifyToken = jest
        .fn()
        .mockResolvedValueOnce({ exp: 1 });
      const promise = oauthService.revokeToken('token');
      await expect(promise).rejects.toThrow(OauthError);
      await expect(promise).rejects.toThrow('Token expired');
    });
    it('should throw an error to faliure to revoke token', async () => {
      mockTokenService.verifyToken = jest
        .fn()
        .mockResolvedValueOnce(mockTokenVerified);
      mockTokenService.revokeToken = jest.fn().mockResolvedValueOnce(null);
      const promise = oauthService.revokeToken('token');
      await expect(promise).rejects.toThrow(InternalServerErrorException);
      await expect(promise).rejects.toThrow('Failure to revoke token');
    });
    it('should throw an error to faliure to save token like blocked on redis !', async () => {
      mockTokenService.verifyToken = jest
        .fn()
        .mockResolvedValueOnce(mockTokenVerified);
      mockTokenService.revokeToken = jest
        .fn()
        .mockResolvedValueOnce(mockResultRevokeTokenSevice);
      mockTokenService.decodeToken = jest
        .fn()
        .mockResolvedValueOnce({ exp: undefined });
      mockRedisService.set = jest.fn().mockResolvedValueOnce(null);
      const promise = oauthService.revokeToken('token');
      await expect(promise).rejects.toThrow(InternalServerErrorException);
      await expect(promise).rejects.toThrow(
        'Failure to save token like blocked on redis',
      );
    });
  });
  describe('tokenIntroapect', () => {
    const mockResultTokenIntropect = {
      active: true,
      sub: 'sub-01',
      client_id: 'clientId-01',
      scope: 'scope 1 scope 2',
      exp: 1,
      iat: 2,
    };
    it('should token introspect', async () => {
      mockRedisService.get = jest.fn().mockResolvedValueOnce(null);
      mockTokenService.tokenIntrospect = jest
        .fn()
        .mockResolvedValueOnce(mockResultTokenIntropect);
      const result = await oauthService.tokenIntrospect('token');
      expect(result).toEqual(mockResultTokenIntropect);
    });
    it('should return active false when has token on blocked list', async () => {
      mockRedisService.get = jest.fn().mockResolvedValueOnce(true);
      const result = await oauthService.tokenIntrospect('token');
      expect(result).toEqual({ active: false });
    });
  });
});
