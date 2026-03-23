import { InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  ClientController,
  IClientController,
} from '../../../src/controller/client.controller';
import { SaveClientDTO } from '../../../src/dto/save-client.dto';
import { ClientService } from '../../../src/service/client.service';
import { mockClientService } from '../mock/client.mock';

describe('ClientController', () => {
  let clientController: IClientController;
  const client: SaveClientDTO = {
    name: 'Test Client',
    redirectUris: ['http://localhost:3000/callback'],
    grantTypes: ['authorization_code'],
    scopes: ['read', 'write'],
  };
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClientController],
      providers: [
        {
          provide: ClientService,
          useValue: mockClientService,
        },
      ],
    }).compile();

    clientController = module.get<IClientController>(ClientController);
  });
  it('should be defined', () => {
    expect(clientController).toBeDefined();
  });
  it('should create a client', async () => {
    mockClientService.create = jest.fn().mockResolvedValue(client);
    const result = await clientController.create(client);
    expect(mockClientService.create).toHaveBeenCalledWith(client);
    expect(result).toEqual(client);
  });
  it('should throw an error to create a client', async () => {
    mockClientService.create = jest
      .fn()
      .mockRejectedValue(
        new InternalServerErrorException('Internal Server Error'),
      );
    const promise = clientController.create(client);
    await expect(promise).rejects.toThrow(InternalServerErrorException);
    await expect(promise).rejects.toThrow('Internal Server Error');
  });
});
