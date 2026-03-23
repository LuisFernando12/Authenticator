import { IUserRepository } from '../../../src/repository/user.repository';
import { IUserService } from '../../../src/service/user.service';

export const mockUserRepository: IUserRepository = {
  create: jest.fn(),
  findByEmail: jest.fn(),
  existsUser: jest.fn(),
  activeAccount: jest.fn(),
  updatePassword: jest.fn(),
};
export const mockUserService: IUserService = {
  register: jest.fn(),
  findByEmail: jest.fn(),
};
