import { ITokenService } from '../../../src/service/token.service';

export const mockTokenService: ITokenService & {
  generateExpireAt: () => number;
  generateRefreshToken: () => void;
} = {
  generateExpireAt: (seconds: number = 900): number => {
    const expiresAt = new Date(Date.now() + seconds * 1000);
    return Math.floor(expiresAt.valueOf() / 1000);
  },
  generateToken: jest.fn().mockResolvedValue('token'),
  generateRefreshToken: jest.fn().mockResolvedValue('refreshToken'),
  saveToken: jest.fn().mockResolvedValue({
    access_token: 'token',
    expiresAt: '2023-01-01T00:00:00.000Z',
  }),
  verifyToken: jest.fn().mockResolvedValue(true),
  decodeToken: jest.fn().mockResolvedValue({
    sub: '1',
    username: 'john.doe@example.com',
  }),
  refreshToken: jest.fn(),
  revokeToken: jest.fn(),
  tokenIntrospect: jest.fn(),
};
