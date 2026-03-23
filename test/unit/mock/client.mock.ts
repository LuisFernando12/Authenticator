import { IClientRepository } from '../../../src/repository/client.repository';
import { IClientService } from '../../../src/service/client.service';

export const mockClientRepository: IClientRepository = {
  create: jest.fn(),
  findByClientId: jest.fn(),
  findByClientSecret: jest.fn(),
};
export const mockClientService: IClientService = {
  create: jest.fn(),
  findByClientId: jest.fn(),
};
