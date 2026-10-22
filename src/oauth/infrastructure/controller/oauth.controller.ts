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
import {
  ContextClient,
  IContextClient,
} from '../../../config/decorator/context-client.decorator';
import { TotpDTO } from '../../../mfa/infrastructure/dto/totp.dto';
import { AuthorizeUseCase } from '../../application/use-case/authorize.use-case';
import { ExchangeOauthCodeUseCase } from '../../application/use-case/exchange-auth-code.use-case';
import { LoginUseCase } from '../../application/use-case/login.use-case';
import { OauthTOTPVerifyUseCase } from '../../application/use-case/oauth-totp-verify.use-case';
import { RefreshTokenUseCase } from '../../application/use-case/refresh-token.use-case';
import { RevokeTokenUseCase } from '../../application/use-case/revoke-token.use-case';
import { TokenIntrospectUseCase } from '../../application/use-case/token-introspect.use-case';
import { OauthAccessToken } from '../../domain/entity/oauth-access-token.entity';
import { LoginDTO } from '../dto/login.dto';
import {
  OauthAuthorizeDTO,
  OauthRefreshTokenDTO,
  OauthTokenDTO,
} from '../dto/oauth-authorize.dto';
import { OauthTOTPVerifyDTO } from '../dto/oauth-totp-verify.dto';
import { RevokeTokenDTO, TokenIntrospectDTO } from '../dto/token.dto';

export interface IOauthController {
  authorize(
    payloadOauthAuthorize: Omit<OauthAuthorizeDTO, 'oauthRequestId'>,
  ): Promise<{
    url: string;
    statusCode: number;
  }>;
  token(payloadOauthToken: OauthTokenDTO): Promise<OauthAccessToken>;
  login(
    payloadOauthLogin: LoginDTO,
    QueryOauthLogin: OauthAuthorizeDTO,
    contextClient: IContextClient,
  ): Promise<{
    url: string;
    statusCode: number;
  }>;
  refreshToken(
    { refreshToken, grantType }: OauthRefreshTokenDTO,
    contextClient: IContextClient,
  ): Promise<any>;
  revokeToken({ token }: RevokeTokenDTO): Promise<any>;
  tokenIntrospect({ token }: TokenIntrospectDTO): Promise<any>;
}
@Controller('oauth')
@Throttle({ default: { limit: 5, ttl: 60000 } })
export class OauthController implements IOauthController {
  constructor(
    private readonly authorizeUseCase: AuthorizeUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly revokeTokenUseCase: RevokeTokenUseCase,
    private readonly tokenIntrospectUseCase: TokenIntrospectUseCase,
    private readonly exchangeOauthCodeUseCase: ExchangeOauthCodeUseCase,
    private readonly oauthTotpVerifyUseCase: OauthTOTPVerifyUseCase,
  ) {}
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
    const urlRedirect = await this.authorizeUseCase.execute(
      payloadOauthAuthorize,
    );
    return { url: urlRedirect.toString(), statusCode: 302 };
  }
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
    return await this.exchangeOauthCodeUseCase.execute(payloadOauthToken);
  }

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
    @ContextClient() contextClient: IContextClient,
  ): Promise<any> {
    const urlRedirect = await this.loginUseCase.execute(
      {
        ...payloadOauthLogin,
        ip: contextClient.ip,
        userAgent: contextClient.userAgent,
      },
      QueryOauthLogin,
    );
    return { url: urlRedirect.toString(), statusCode: 302 };
  }
  @Post('mfa/totp/verify')
  @Redirect()
  @HttpCode(HttpStatus.FOUND)
  @ApiResponse({
    status: HttpStatus.FOUND,
    description: 'TOTP verified successfully',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async oauthVerifyTotp(
    @Body() { code }: TotpDTO,
    @Query() queryOauth: OauthTOTPVerifyDTO,
  ) {
    const url = await this.oauthTotpVerifyUseCase.execute({
      code: code,
      queryOauth: queryOauth,
    });

    return { url: url.toString(), statusCode: 302 };
  }

  @Post('/refresh-token')
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
    @ContextClient() contextClient: IContextClient,
  ): Promise<OauthAccessToken> {
    return await this.refreshTokenUseCase.execute({
      refreshToken,
      grantType,
      ip: contextClient.ip,
      userAgent: contextClient.userAgent,
    });
  }
  @Post('/revoke-token')
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
    return await this.revokeTokenUseCase.execute(token);
  }
  @Post('/token-introspect')
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Token introspected successfully',
  })
  async tokenIntrospect(@Body() { token }: TokenIntrospectDTO): Promise<any> {
    return await this.tokenIntrospectUseCase.execute(token);
  }
}
