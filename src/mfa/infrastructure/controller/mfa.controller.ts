import { AuthGuard } from '@/core/infrastructure/guard/auth.guard';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBody, ApiResponse } from '@nestjs/swagger';
import {
  Request,
  RequestType,
} from '../../../core/infrastructure/decorator/request.decorator';
import { TOTPGenerateQrCodeUseCase } from '../../application/use-case/totp-generate-qrCode.use-case';
import { TOTPRegisterUseCase } from '../../application/use-case/totp-register.use-case';
import { TOTPVerifyUseCase } from '../../application/use-case/totp-verify.use-case';
import { TotpDTO } from '../dto/totp.dto';

@Controller('mfa')
export class MFAController {
  constructor(
    private readonly totpRegisterUseCase: TOTPRegisterUseCase,
    private readonly totpGenerateQrCodeUseCase: TOTPGenerateQrCodeUseCase,
    private readonly totpVerifyUseCase: TOTPVerifyUseCase,
  ) {}
  @Get('totp/qr-code')
  @UseGuards(AuthGuard)
  @ApiResponse({ status: HttpStatus.OK, description: 'QrCode generated' })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
  })
  async Qrcode(@Request() request: RequestType) {
    return await this.totpGenerateQrCodeUseCase.execute({
      userId: request.user.sub,
      email: request.user.email,
    });
  }
  @Post('totp/register')
  @UseGuards(AuthGuard)
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Created MFA and register TOTP ',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
  })
  async registerTotp(
    @Request() request: RequestType,
    @Body() { code }: TotpDTO,
  ): Promise<void> {
    await this.totpRegisterUseCase.execute({
      userId: request.user.sub,
      code: code,
    });
  }
  @Post('totp/verify')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBody({
    type: TotpDTO,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'TOTP verified successfully',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async verifyTotp(@Body() { code }: TotpDTO, @Request() request: RequestType) {
    const response = await this.totpVerifyUseCase.execute({
      userId: request.user.sub,
      code: code,
      email: request.user.email,
    });
    return response;
  }
}
