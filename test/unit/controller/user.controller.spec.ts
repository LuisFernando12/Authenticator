import { Test, TestingModule } from '@nestjs/testing';
import {
  IUserController,
  UserController,
} from '../../../src/controller/user.controller';
import { UserService } from '../../../src/service/user.service';
import { mockUserService } from '../mock/user.mock';

describe('UserController', () => {
  let userController: IUserController;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    userController = module.get<IUserController>(UserController);
  });
  it('should be defined', () => {
    expect(userController).toBeDefined();
  });
  describe('register', () => {
    it('should return a success message: user created. Please verify your email to account active', async () => {
      mockUserService.register = jest.fn().mockResolvedValue('OK');
      const result = await userController.register({
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'strongPassword',
      });
      expect(result).toEqual({
        message: 'User created. Please verify your email to account active!',
      });
    });
    it('should return a success message: User created. Please verify your email to account active, , if you have not received the email request it again!', async () => {
      mockUserService.register = jest
        .fn()
        .mockResolvedValue('failure to send email');
      const result = await userController.register({
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'strongPassword',
      });
      expect(result).toEqual({
        message:
          'User created. Please verify your email to account active, if you have not received the email request it again!',
      });
    });
  });
});
