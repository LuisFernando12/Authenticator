import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { IUserClientConsent } from '../../../src/dto/user-client-consent.dto';
import { UserClientConsentRepository } from '../../../src/repository/user-client-consent.repository';
import {
  IUserClientConsentService,
  UserClientConsentService,
} from '../../../src/service/user-client-consent.service';
import { mockUserClientConsentRespository } from '../mock/userClient.mock';

describe('UserClientConsentService', () => {
  let userClientConsentService: IUserClientConsentService;
  const mockUserClientConsent: IUserClientConsent = {
    userId: 'user-id',
    clientId: 'client-id',
    scopes: ['read', 'write'],
  };
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserClientConsentService,
        {
          provide: UserClientConsentRepository,
          useValue: mockUserClientConsentRespository,
        },
      ],
    }).compile();
    userClientConsentService = module.get<IUserClientConsentService>(
      UserClientConsentService,
    );
  });
  it('should be defined', () => {
    expect(userClientConsentService).toBeDefined();
  });
  describe('create', () => {
    it('should create a user client consent', async () => {
      mockUserClientConsentRespository.create = jest
        .fn()
        .mockResolvedValueOnce(true);
      const result = await userClientConsentService.create(
        mockUserClientConsent,
      );
      expect(result).toBe(true);
      expect(mockUserClientConsentRespository.create).toHaveBeenCalledWith(
        mockUserClientConsent,
      );
    });
    it('should throw an error to create a user client consent', async () => {
      mockUserClientConsentRespository.create = jest
        .fn()
        .mockResolvedValueOnce(null);
      const promise = userClientConsentService.create(mockUserClientConsent);
      await expect(promise).rejects.toThrow(InternalServerErrorException);
      await expect(promise).rejects.toThrow(
        'Failure to create user client consent',
      );
    });
  });
  describe('findByUserIdAndClientId', () => {
    it('should find a user client consent by userId and clientId', async () => {
      mockUserClientConsentRespository.findByUserIdAndClientId = jest
        .fn()
        .mockResolvedValueOnce([mockUserClientConsent]);
      const result = await userClientConsentService.findByUserIdAndClientId(
        mockUserClientConsent.userId,
        mockUserClientConsent.clientId,
      );
      expect(result).toEqual([mockUserClientConsent]);
    });
    it('should throw an error to invalid params', async () => {
      const promise = userClientConsentService.findByUserIdAndClientId(
        null,
        null,
      );
      await expect(promise).rejects.toThrow(BadRequestException);
      await expect(promise).rejects.toThrow('Invalid params');
    });
    it('should throw an error to find a  consent by userId and clientId', async () => {
      mockUserClientConsentRespository.findByUserIdAndClientId = jest
        .fn()
        .mockResolvedValueOnce(null);
      const promise = userClientConsentService.findByUserIdAndClientId(
        mockUserClientConsent.userId,
        mockUserClientConsent.clientId,
      );

      await expect(promise).rejects.toThrow(NotFoundException);
      await expect(promise).rejects.toThrow('Consents not found');
    });
  });
  describe('findByUserId', () => {
    it('should find a user client consent by userId', async () => {
      mockUserClientConsentRespository.findByUserId = jest
        .fn()
        .mockResolvedValueOnce([mockUserClientConsent]);
      const result = await userClientConsentService.findByUserId(
        mockUserClientConsent.userId,
      );
      expect(result).toEqual([mockUserClientConsent]);
    });
    it('should throw an error to invalid param', async () => {
      const promise = userClientConsentService.findByUserId(null);
      await expect(promise).rejects.toThrow(BadRequestException);
      await expect(promise).rejects.toThrow('Invalid param');
    });
    it('should throw error to find a consent by userId', async () => {
      mockUserClientConsentRespository.findByUserId = jest
        .fn()
        .mockResolvedValueOnce([]);
      const promise = userClientConsentService.findByUserId(
        mockUserClientConsent.userId,
      );
      await expect(promise).rejects.toThrow(NotFoundException);
      await expect(promise).rejects.toThrow('Consents not found');
    });
  });
});
