import {
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthLogger } from '../../../src/config/logger/auth-logger.config';
import {
  ITokenRepository,
  TokenRepository,
} from '../../../src/repository/token.repository';
import { AppConfigEnvService } from '../../../src/service/app-config-env.service';
import {
  ITokenService,
  TokenService,
} from '../../../src/service/token.service';
import { mockAuthLogger } from '../mock/logger.mock';
import { mockTokenService } from '../mock/token.mock';

describe('TokenService', () => {
  let tokenService: ITokenService;
  const mockTokenRepository: ITokenRepository = {
    create: jest.fn(),
    findByUserId: jest.fn(),
    update: jest.fn(),
    deleteToken: jest.fn(),
    findByToken: jest.fn(),
  };
  const mockJwtService = {
    sign: jest.fn(),
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
    verify: jest.fn(),
    decode: jest.fn(),
  };
  const mockAppconfigEnvService = {
    secret: 'secret',
  };
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenService,
        {
          provide: TokenRepository,
          useValue: mockTokenRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: AppConfigEnvService,
          useValue: mockAppconfigEnvService,
        },
        {
          provide: AuthLogger,
          useValue: mockAuthLogger,
        },
      ],
    }).compile();
    tokenService = module.get<TokenService>(TokenService);
  });
  it('should be defined', () => {
    expect(tokenService).toBeDefined();
  });
  describe('generateToken', () => {
    const payload = {
      sub: '1',
      username: 'john.doe@example.com',
    };
    it('should generate a object token with payload', async () => {
      jest
        .spyOn(mockJwtService, 'signAsync')
        .mockResolvedValueOnce('token')
        .mockResolvedValueOnce('refreshToken');
      tokenService.saveToken = jest.fn().mockResolvedValueOnce({
        access_token: 'token',
        refresh_token: 'refreshToken',
        expiresAt: '2023-01-01T00:00:00.000Z',
      });
      const result = await tokenService.generateToken(payload);
      expect(mockJwtService.signAsync).toHaveBeenCalledWith(payload, {
        expiresIn: '15min',
        secret: mockAppconfigEnvService.secret,
      });
      expect(result).toEqual({
        access_token: 'token',
        expiresAt: '2023-01-01T00:00:00.000Z',
        refresh_token: 'refreshToken',
      });
    });
    it('should generate a string token with payload', async () => {
      payload['type'] = 'verify-email';
      mockJwtService.signAsync = jest.fn().mockResolvedValueOnce('token');
      const result = await tokenService.generateToken(payload);
      expect(result).toBe('token');
    });
    it('should throw an error to generate a token', async () => {
      mockJwtService.signAsync = jest.fn().mockResolvedValueOnce(null);
      const promise = tokenService.generateToken(payload);
      await expect(promise).rejects.toThrow(InternalServerErrorException);
      await expect(promise).rejects.toThrow('Failure to generate token');
    });
    it('should throw an error to generate a refresh token', async () => {
      payload['type'] = '';
      jest
        .spyOn(mockJwtService, 'signAsync')
        .mockResolvedValueOnce('token')
        .mockResolvedValueOnce(null);

      const promise = tokenService.generateToken(payload);
      await expect(promise).rejects.toThrow(InternalServerErrorException);
      await expect(promise).rejects.toThrow(
        'Failure to generate refresh token',
      );
    });
  });
  describe('saveToken', () => {
    const data = {
      token: 'token',
      refreshToken: 'refreshToken',
      userId: '1',
      expiresAt: new Date('2023-01-01T00:00:00.000Z'),
    };
    it('should save a token', async () => {
      mockTokenRepository.findByUserId = jest.fn().mockResolvedValueOnce(null);
      mockTokenRepository.create = jest.fn().mockResolvedValueOnce(data);
      const result = await tokenService.saveToken(
        data.token,
        data.refreshToken,
        data.userId,
        data.expiresAt,
      );
      expect(mockTokenRepository.findByUserId).toHaveBeenCalledWith(
        data.userId,
      );
      expect(mockTokenRepository.create).toHaveBeenCalledWith({
        token: data.token,
        refreshToken: data.refreshToken,
        user: { id: data.userId },
        expiresAt: data.expiresAt,
      });
      expect(result).toEqual({
        access_token: data.token,
        refresh_token: data.refreshToken,
        expiresAt: data.expiresAt.toISOString(),
      });
    });
    it('should update a token', async () => {
      data['id'] = '01';
      mockTokenRepository.findByUserId = jest.fn().mockResolvedValueOnce(data);
      mockTokenRepository.update = jest.fn().mockResolvedValueOnce({
        affected: 1,
      });
      const result = await tokenService.saveToken(
        data.token,
        data.refreshToken,
        data.userId,
        data.expiresAt,
      );
      expect(result).toEqual({
        access_token: data.token,
        refresh_token: data.refreshToken,
        expiresAt: data.expiresAt.toISOString(),
      });
    });
    it('should throw an error to update a token', async () => {
      mockTokenRepository.findByUserId = jest.fn().mockResolvedValueOnce(data);
      mockTokenRepository.update = jest.fn().mockResolvedValueOnce({
        affected: 0,
      });
      const promise = tokenService.saveToken(
        data.token,
        data.refreshToken,
        data.userId,
        data.expiresAt,
      );
      await expect(promise).rejects.toThrow('Failure to update token');
      await expect(promise).rejects.toThrow(InternalServerErrorException);
    });
  });
  describe('verifyToken', () => {
    const token = 'token';
    it('should verify a token', async () => {
      mockJwtService.verifyAsync = jest.fn().mockResolvedValueOnce(true);
      const result = await tokenService.verifyToken(token);
      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith(token, {
        secret: mockAppconfigEnvService.secret,
      });
      expect(result).toBe(true);
    });
    it('should return false to verify a token', async () => {
      mockJwtService.verifyAsync = jest.fn().mockResolvedValueOnce(false);
      const result = await tokenService.verifyToken(token);
      expect(result).toBe(false);
    });
    it('should throw an error to verify a token', async () => {
      mockJwtService.verifyAsync = jest.fn().mockRejectedValueOnce(null);
      const promise = tokenService.verifyToken(token);
      await expect(promise).resolves.toBe(false);
    });
  });
  describe('decodeToken', () => {
    const token = 'token';
    it('should decode a token', async () => {
      mockJwtService.decode = jest.fn().mockResolvedValueOnce({
        sub: '1',
        username: 'john.doe@example.com',
      });
      const result = await tokenService.decodeToken(token);
      expect(mockJwtService.decode).toHaveBeenCalledWith(token);
      expect(result).toEqual({
        sub: '1',
        username: 'john.doe@example.com',
      });
    });
  });
  describe('refreshToken', () => {
    const tokenResult = {
      id: '1',
      userId: 'userId-01',
      token: 'token',
      refreshToken: 'refreshToken',
      expiresAt: mockTokenService.generateExpireAt(),
    };
    const mockPayload = {
      sub: 'sub-01',
      username: 'jondoe@example.com',
      aud: 'clientId-01',
      iss: 'www.exemple.api.com',
      scope: 'scope1 scope2',
    };
    it('should be refresh a token', async () => {
      jest
        .spyOn(mockTokenRepository, 'findByUserId')
        .mockResolvedValueOnce(tokenResult as any)
        .mockResolvedValueOnce(tokenResult as any);
      jest
        .spyOn(mockJwtService, 'signAsync')
        .mockResolvedValueOnce('newRefreshToken')
        .mockResolvedValueOnce('newToken');
      mockTokenRepository.update = jest.fn().mockResolvedValueOnce({
        affected: 1,
      });

      const result = await tokenService.refreshToken(
        mockPayload,
        'refreshToken',
      );
      expect(result).toEqual({
        access_token: 'newToken',
        expiresAt: new Date(
          mockTokenService.generateExpireAt() * 1000,
        ).toISOString(),
        refresh_token: 'newRefreshToken',
      });
    });
    it('should throw an error to refresh token with Token not found ', async () => {
      mockTokenRepository.findByUserId = jest.fn().mockResolvedValueOnce(null);
      const promise = tokenService.refreshToken(mockPayload, 'refreshToken');
      await expect(promise).rejects.toThrow('Token not found');
      await expect(promise).rejects.toThrow(NotFoundException);
    });
    it('should throw an error to refresh token with invalid refresh token ', async () => {
      mockTokenRepository.findByUserId = jest
        .fn()
        .mockResolvedValueOnce(tokenResult as any);
      const promise = tokenService.refreshToken(
        mockPayload,
        'refreshToken-invalid',
      );
      await expect(promise).rejects.toThrow('Invalid refresh token');
      await expect(promise).rejects.toThrow(UnauthorizedException);
    });
    it('should throw an error to refresh token with failure to generate refresh token ', async () => {
      mockTokenRepository.findByUserId = jest
        .fn()
        .mockResolvedValueOnce(tokenResult as any);
      mockJwtService.signAsync = jest.fn().mockResolvedValueOnce(null);
      const promise = tokenService.refreshToken(mockPayload, 'refreshToken');
      await expect(promise).rejects.toThrow(
        'Failure to generate refresh token',
      );
      await expect(promise).rejects.toThrow(InternalServerErrorException);
    });
    it('should throw an error to refresh token with failure to generate new token ', async () => {
      mockTokenRepository.findByUserId = jest
        .fn()
        .mockResolvedValueOnce(tokenResult as any);
      jest
        .spyOn(mockJwtService, 'signAsync')
        .mockResolvedValueOnce('newRefreshToken')
        .mockResolvedValueOnce(null);
      const promise = tokenService.refreshToken(mockPayload, 'refreshToken');
      await expect(promise).rejects.toThrow('Failure to generate new token');
      await expect(promise).rejects.toThrow(InternalServerErrorException);
    });
  });
  describe('revokeToken', () => {
    const tokenResult = {
      id: '1',
      userId: 'userId-01',
      token: 'token',
      refreshToken: 'refreshToken',
      expiresAt: new Date('2023-01-01T00:00:00.000Z'),
    };
    it('should revoke a token', async () => {
      mockTokenRepository.findByToken = jest
        .fn()
        .mockResolvedValueOnce(tokenResult);
      mockTokenRepository.deleteToken = jest.fn().mockResolvedValueOnce({
        affected: 1,
      });
      const result = await tokenService.revokeToken('token');
      expect(result).toEqual({
        affected: 1,
        accessToken: 'token',
      });
    });
    it('should throw an error to revoke token with Token not found ', async () => {
      mockTokenRepository.findByToken = jest.fn().mockResolvedValueOnce(null);
      const promise = tokenService.revokeToken('token');
      await expect(promise).rejects.toThrow('Token not found');
      await expect(promise).rejects.toThrow(NotFoundException);
    });
    it('should throw an error to revoke token with failure to delete token ', async () => {
      mockTokenRepository.findByToken = jest
        .fn()
        .mockResolvedValueOnce(tokenResult);
      mockTokenRepository.deleteToken = jest.fn().mockResolvedValueOnce({
        affected: 0,
      });
      const promise = tokenService.revokeToken('token');
      await expect(promise).rejects.toThrow('Failure to delete token');
      await expect(promise).rejects.toThrow(InternalServerErrorException);
    });
  });
  describe('tokenIntrospect', () => {
    const tokenResult = {
      id: '1',
      userId: 'userId-01',
      token: 'token',
      refreshToken: 'refreshToken',
      expiresAt: new Date('2023-01-01T00:00:00.000Z'),
    };
    const tokenVerified = {
      sub: 'sub-01',
      username: 'jondoe@example.com',
      aud: 'cleintId-01',
      scope: 'scope1 scope2',
      exp: 1,
      iat: 1,
    };
    it('should introspect a token', async () => {
      mockTokenRepository.findByToken = jest
        .fn()
        .mockResolvedValueOnce(tokenResult);
      mockJwtService.verifyAsync = jest
        .fn()
        .mockResolvedValueOnce(tokenVerified);
      const result = await tokenService.tokenIntrospect('token');
      expect(result).toEqual({
        active: true,
        sub: 'sub-01',
        client_id: 'cleintId-01',
        scope: 'scope1 scope2',
        exp: 1,
        iat: 1,
      });
    });
    it('should reuturn active false when token not found', async () => {
      mockTokenRepository.findByToken = jest.fn().mockResolvedValueOnce(null);
      const result = await tokenService.tokenIntrospect('token');
      expect(result).toEqual({ active: false });
    });
    it('should return active false when token is invalid', async () => {
      mockTokenRepository.findByToken = jest
        .fn()
        .mockResolvedValueOnce(tokenResult);
      mockJwtService.verifyAsync = jest.fn().mockResolvedValueOnce(null);
      const result = await tokenService.tokenIntrospect('token');
      expect(result).toEqual({
        active: false,
      });
    });
  });
});
