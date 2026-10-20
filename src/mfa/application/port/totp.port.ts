export const TOTP_PORT = Symbol('TOTP_PORT');
export abstract class TOTPPort {
  abstract generateSecret(): string;
  abstract encodeSecretToBase32(secret: string): string;
  abstract generateTOTPUri(
    secretBase32: string,
    accountName: string,
    issuer: string,
  ): string;
  abstract generateQRCode(uri: string): Promise<string>;
  abstract verifyTOTP(code: string, secretBase32: string): void;
}
