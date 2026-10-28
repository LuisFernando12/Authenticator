import { randomBytes } from 'node:crypto';
import * as OTPAuth from 'otpauth';
import * as QRCode from 'qrcode';
import { TOTPPort } from '../../application/port/totp.port';
import { MFAError } from '../../domain/error/mfa.error';
export class TOTPAdapter implements TOTPPort {
  generateSecret(): string {
    return randomBytes(64).toString('hex');
  }
  encodeSecretToBase32(secret: string): string {
    return OTPAuth.Secret.fromHex(secret).base32;
  }
  generateTOTPUri(
    secretBase32: string,
    accountName: string,
    issuer: string,
  ): string {
    return new OTPAuth.TOTP({
      issuer: issuer,
      label: accountName,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: secretBase32,
    }).toString();
  }
  async generateQRCode(uri: string): Promise<string> {
    try {
      return await QRCode.toString(uri, { type: 'svg' });
    } catch (error) {
      throw new Error('Error to create a qrcode', { cause: error });
    }
  }
  verifyTOTP(code: string, secret: string): void {
    const validate = OTPAuth.TOTP.validate({
      secret: OTPAuth.Secret.fromHex(secret),
      token: code,
      window: 1,
    });
    if (validate !== null && validate >= 0) {
      return;
    }
    throw MFAError.unauthorizedMFA('Invalid totp code');
  }
}
