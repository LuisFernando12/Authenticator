import { IUserClientConsentRepository } from '../../../src/repository/user-client-consent.repository';
import { IUserClientConsentService } from '../../../src/service/user-client-consent.service';

export const mockUserClientConsentRespository: IUserClientConsentRepository = {
  create: jest.fn(),
  findByUserIdAndClientId: jest.fn(),
  findByUserId: jest.fn(),
};
export const mockUserClientConsentService: IUserClientConsentService = {
  create: jest.fn(),
  findByUserIdAndClientId: jest.fn(),
  findByUserId: jest.fn(),
};
