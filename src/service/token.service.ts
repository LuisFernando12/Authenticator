import { AuthLogger } from '@/config/logger/auth-logger.config';
import { TokenRepository } from '@/repository/token.repository';
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DeleteResult } from 'typeorm';
import { AppConfigEnvService } from './app-config-env.service';

export interface IResponseTokenIntrospect {
  active: boolean;
  sub: string;
  client_id: string;
  scope: string;
  exp: number;
  iat: number;
}

type TypeToken = 'verify-email' | '';
interface IGenerateToken {
  sub: string;
  username: string;
  aud?: string;
  iss?: string;
  scope?: string;
  type?: TypeToken;
}
export interface ITokenService {
  generateToken(payload: IGenerateToken): Promise<any>;
  saveToken(
    token: string,
    refreshToken: string,
    userId: string,
    expiresAt: Date,
  ): Promise<any>;
  verifyToken(token: string): Promise<any>;
  decodeToken(token: string): Promise<any>;
  refreshToken(
    payload: Omit<IGenerateToken, 'type'>,
    token: string,
  ): Promise<any>;
  revokeToken(token: string): Promise<any>;
  tokenIntrospect(token: string): Promise<any>;
}

@Injectable()
export class TokenService implements ITokenService {
  constructor(
    private readonly tokenRepository: TokenRepository,
    private readonly jwtService: JwtService,
    private appConfigEnvSevice: AppConfigEnvService,
    private readonly AuthLogger: AuthLogger,
  ) {}
  private generateExpireAt(seconds: number = 900): number {
    const expiresAt = new Date(Date.now() + seconds * 1000);
    return Math.floor(expiresAt.valueOf() / 1000);
  }
  private async generateRefreshToken(payload: IGenerateToken) {
    const refreshToken = await this.jwtService.signAsync(payload, {
      expiresIn: `15d`,
      secret: this.appConfigEnvSevice.secret,
    });
    if (!refreshToken) {
      throw new InternalServerErrorException(
        'Failure to generate refresh token',
      );
    }
    return refreshToken;
  }

  async saveToken(
    token: string,
    refreshToken: string,
    userId: string,
    expiresAt: Date,
  ): Promise<any> {
    const tokenDB = await this.tokenRepository.findByUserId(userId);
    if (!tokenDB) {
      const tokenSave = await this.tokenRepository.create({
        token,
        refreshToken,
        user: { id: userId },
        expiresAt: new Date(expiresAt),
      });
      return {
        access_token: tokenSave.token,
        refresh_token: tokenSave.refreshToken,
        expiresAt: expiresAt.toISOString(),
      };
    } else {
      const payloadTokenUpdate = {
        id: tokenDB.id,
        token,
        expiresAt: new Date(expiresAt),
      };

      payloadTokenUpdate['refreshToken'] = refreshToken;

      const tokenUpdate = await this.tokenRepository.update(payloadTokenUpdate);
      if (!tokenUpdate.affected) {
        throw new InternalServerErrorException('Failure to update token');
      }
      return {
        access_token: token,
        refresh_token: refreshToken,
        expiresAt: expiresAt.toISOString(),
      };
    }
  }

  async generateToken(
    payload: IGenerateToken,
  ): Promise<
    { access_token: string; refresh_token: string; expiresAt: string } | string
  > {
    const expiresAt = this.generateExpireAt();
    const token = await this.jwtService.signAsync(payload, {
      expiresIn: `15min`,
      secret: this.appConfigEnvSevice.secret,
    });
    if (!token) {
      throw new InternalServerErrorException('Failure to generate token');
    }
    if (payload.type === 'verify-email') {
      return token;
    }
    const refreshToken = await this.generateRefreshToken(payload);
    return await this.saveToken(
      token,
      refreshToken,
      payload.sub,
      new Date(expiresAt * 1000),
    );
  }
  async verifyToken(token: string): Promise<any> {
    try {
      return await this.jwtService.verifyAsync(token, {
        secret: this.appConfigEnvSevice.secret,
      });
    } catch (_error) {
      return false;
    }
  }
  async decodeToken(token: string): Promise<any> {
    return await this.jwtService.decode(token);
  }
  async refreshToken(
    payload: Omit<IGenerateToken, 'type'>,
    token: string,
  ): Promise<any> {
    const tokenDB = await this.tokenRepository.findByUserId(payload.sub);
    if (!tokenDB) {
      throw new NotFoundException('Token not found');
    }
    if (tokenDB.refreshToken !== token) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    const refreshToken = await this.generateRefreshToken(payload);
    const newAccessToken = await this.jwtService.signAsync(payload, {
      expiresIn: `15min`,
      secret: this.appConfigEnvSevice.secret,
    });
    if (!newAccessToken) {
      throw new InternalServerErrorException('Failure to generate new token');
    }
    const expireAt = this.generateExpireAt();

    return this.saveToken(
      newAccessToken,
      refreshToken,
      payload.sub,
      new Date(expireAt * 1000),
    );
  }
  async revokeToken(
    token: string,
  ): Promise<DeleteResult & { accessToken: string }> {
    const tokenDB = await this.tokenRepository.findByToken(token);
    if (!tokenDB) {
      throw new NotFoundException('Token not found');
    }
    const tokenDelete = await this.tokenRepository.deleteToken(tokenDB);
    if (!tokenDelete.affected) {
      throw new InternalServerErrorException('Failure to delete token');
    }

    return {
      ...tokenDelete,
      accessToken: tokenDB.token,
    };
  }
  async tokenIntrospect(
    token: string,
  ): Promise<IResponseTokenIntrospect | { active: boolean }> {
    this.AuthLogger.log('Starting method tokenIntrospect', {
      context: 'TokenService method tokenIntrospect',
    });
    const tokenDB = await this.tokenRepository.findByToken(token);
    if (!tokenDB) {
      this.AuthLogger.error(`Token not found: ${token}`, {
        context: 'TokenService method tokenIntrospect',
      });
      return { active: false };
    }
    const tokenIsValid = await this.verifyToken(token);
    if (!tokenIsValid) {
      this.AuthLogger.error('Invalid token', {
        context: 'TokenService method tokenIntrospect',
      });
      return { active: false };
    }

    return {
      active: true,
      sub: tokenIsValid.sub,
      client_id: tokenIsValid.aud,
      scope: tokenIsValid.scope,
      exp: tokenIsValid.exp,
      iat: tokenIsValid.iat,
    };
  }
}
