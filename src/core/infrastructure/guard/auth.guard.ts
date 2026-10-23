import {
  USER_REPOSITORY_PORT,
  UserRepositoryPort,
} from '@/core/application/port/user-repository.port';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
interface TokenDecode {
  sub: string;
  username: string;
  jti: string;
  tokenFamilyId: string;
  iat: number;
  exp: number;
  type: 'access' | 'email_verification' | 'mfa';
}
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(JwtService) private readonly jwtService: JwtService,
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepositoryPort,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException('No token provided');
    }
    try {
      const decoded = await this.jwtService.verifyAsync<TokenDecode>(token, {
        secret: process.env.SECRET,
      });
      if (!decoded) {
        throw new UnauthorizedException('Invalid token');
      }
      if (decoded.type === 'email_verification') {
        throw new UnauthorizedException('Access unauthorized !');
      }
      if (
        (decoded.type === 'mfa' &&
          request.url !== '/api/auth/mfa/totp/verify') ||
        (decoded.type !== 'mfa' && request.url === '/api/auth/mfa/totp/verify')
      ) {
        throw new ForbiddenException('Access unauthorized !');
      }

      const userDB = await this.userRepository.findByEmail(decoded.username);
      if (!userDB) {
        throw new UnauthorizedException('Unauthorized');
      }

      request['user'] = {
        name: userDB.name,
        sub: userDB.id,
        email: userDB.email,
        createdAt: userDB.createdAt,
      };
      return true;
    } catch (error) {
      if (
        error instanceof ForbiddenException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      throw new UnauthorizedException('Invalid token');
    }
  }
  private extractTokenFromHeader(request: Request): string | null {
    const authHeader = request.headers['authorization'];
    if (!authHeader) {
      return null;
    }
    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : null;
  }
}
