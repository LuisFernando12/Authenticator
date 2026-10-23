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
import {
  REDIS_SERVICE_PORT,
  RedisService,
} from '../../domain/service/redis.service';
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
    @Inject(REDIS_SERVICE_PORT) private readonly redisServicePort: RedisService,
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
      if (decoded.type === 'mfa') {
        await this.validateMFAAccessToken(decoded, request.url);
      }
      if (decoded.type === 'access') {
        await this.validateAccessToken(decoded, request.url);
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

  private async validateMFAAccessToken(decoded: TokenDecode, url: string) {
    if (url !== '/api/auth/mfa/totp/verify') {
      throw new ForbiddenException('Access unauthorized !');
    }
    const hasMFATokenId = await this.redisServicePort.getAndDeleteOnRedis(
      `mfa-access-token-${decoded.jti}`,
    );
    if (!hasMFATokenId) {
      throw new UnauthorizedException('Invalid MFA token');
    }
  }
  private async validateAccessToken(decoded: TokenDecode, url: string) {
    if (url === '/api/auth/mfa/totp/verify') {
      throw new ForbiddenException('Access unauthorized !');
    }
    const hasJtiOnBlockList = await this.redisServicePort.getOnRedis(
      `revoke-token-blocklist:${decoded.jti}`,
    );
    if (hasJtiOnBlockList) {
      throw new UnauthorizedException('Token has been revoked');
    }
  }
}
