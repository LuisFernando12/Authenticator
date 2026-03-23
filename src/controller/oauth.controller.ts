import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Redirect,
} from '@nestjs/common';
import { ApiBody, ApiQuery, ApiResponse, OmitType } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { LoginDTO } from '../dto/login.dto';
import {
  OauthAuthorizeDTO,
  OauthRefreshTokenDTO,
  OauthTokenDTO,
} from '../dto/oauth-authorize.dto';
import { RevokeTokenDTO, TokenIntrospectDTO } from '../dto/token.dto';
import { OauthService } from '../service/oauth.service';
export interface IOauthController {
  authorize(
    payloadOauthAuthorize: Omit<OauthAuthorizeDTO, 'oauthRequestId'>,
  ): Promise<{
    url: string;
    statusCode: number;
  }>;
  token(payloadOauthToken: OauthTokenDTO): Promise<any>;
  login(
    payloadOauthLogin: LoginDTO,
    QueryOauthLogin: OauthAuthorizeDTO,
  ): Promise<{
    url: string;
    statusCode: number;
  }>;
  refreshToken({ refreshToken, grantType }: OauthRefreshTokenDTO): Promise<any>;
  revokeToken({ token }: RevokeTokenDTO): Promise<any>;
  tokenIntrospect({ token }: TokenIntrospectDTO): Promise<any>;
}
@Controller('oauth')
export class OauthController implements IOauthController {
  constructor(private readonly oauthService: OauthService) {}
  @Get('/authorize')
  @Redirect()
  @HttpCode(HttpStatus.FOUND)
  @ApiQuery({ type: OmitType(OauthAuthorizeDTO, ['oauthRequestId'] as const) })
  @ApiResponse({ status: HttpStatus.FOUND, description: 'Found' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad Request' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async authorize(
    @Query() payloadOauthAuthorize: Omit<OauthAuthorizeDTO, 'oauthRequestId'>,
  ): Promise<any> {
    const urlRedirect = await this.oauthService.authorize(
      payloadOauthAuthorize,
    );
    return { url: urlRedirect.toString(), statusCode: 302 };
  }
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('/token')
  @ApiBody({ type: OauthTokenDTO })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Created and returned token',
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad Request' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden' })
  async token(@Body() payloadOauthToken: OauthTokenDTO): Promise<any> {
    return await this.oauthService.token(payloadOauthToken);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('/login')
  @Redirect()
  @HttpCode(HttpStatus.FOUND)
  @ApiBody({ type: LoginDTO })
  @ApiQuery({ type: OauthAuthorizeDTO })
  @ApiResponse({ status: HttpStatus.FOUND, description: 'Found' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad Request' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden' })
  async login(
    @Body() payloadOauthLogin: LoginDTO,
    @Query() QueryOauthLogin: OauthAuthorizeDTO,
  ): Promise<any> {
    const urlRedirect = await this.oauthService.login(
      payloadOauthLogin,
      QueryOauthLogin,
    );
    return { url: urlRedirect.toString(), statusCode: 302 };
  }

  @Post('/refresh-token')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.CREATED)
  @ApiBody({ type: OauthRefreshTokenDTO })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Created and returned token',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad Request' })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal Server Error',
  })
  async refreshToken(
    @Body() { refreshToken, grantType }: OauthRefreshTokenDTO,
  ): Promise<any> {
    return await this.oauthService.refreshToken({ refreshToken, grantType });
  }
  @Post('/revoke-token')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Token revoked successfully',
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad Request' })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal Server Error',
  })
  async revokeToken(@Body() { token }: RevokeTokenDTO): Promise<any> {
    return await this.oauthService.revokeToken(token);
  }
  @Post('/token-introspect')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Token introspected successfully',
  })
  async tokenIntrospect(@Body() { token }: TokenIntrospectDTO): Promise<any> {
    return await this.oauthService.tokenIntrospect(token);
  }
}
