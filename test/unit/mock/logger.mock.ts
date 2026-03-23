import { IAuthLogger } from '../../../src/config/logger/auth-logger.config';
import { IBaseLogger } from '../../../src/config/logger/base-logger';

export const mockAuthLogger: IAuthLogger = {
  log: jest.fn().mockResolvedValue(true),
  error: jest.fn().mockResolvedValue(true),
  warn: jest.fn(),
  debug: jest.fn(),
};
export const mockBaseLogger: IBaseLogger = {
  logAsJson: jest.fn().mockResolvedValue(true),
};
