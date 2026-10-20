import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
@ApiSchema({
  name: 'TOTP',
  description: '',
})
export class TotpDTO {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  code: string;
}
