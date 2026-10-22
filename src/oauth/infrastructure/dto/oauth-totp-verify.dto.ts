import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { OauthAuthorizeDTO } from './oauth-authorize.dto';

export class OauthTOTPVerifyDTO extends OauthAuthorizeDTO {
  @IsString()
  @IsOptional()
  @ApiProperty()
  mfaSchemaId: string;
}
