import { OauthDomainError } from '../error/oauth-domain.error';

interface MFASchemaProps {
  userId: string;
  email: string;
  oauthRequestId: string;
}
export class MFASchemaValueObject {
  constructor(private readonly mfaSchemaProps: MFASchemaProps) {}
  static create(mfaSchemaProps: MFASchemaProps): MFASchemaValueObject {
    return new MFASchemaValueObject(mfaSchemaProps);
  }
  get userId(): string {
    return this.mfaSchemaProps.userId;
  }
  get email(): string {
    return this.mfaSchemaProps.email;
  }
  get oauthRequestId(): string {
    return this.mfaSchemaProps.oauthRequestId;
  }
  validOauthRequestId(oauthRequestId: string) {
    if (oauthRequestId.trim() !== this.mfaSchemaProps.oauthRequestId.trim()) {
      throw OauthDomainError.invalidGrant('Invalid Oauth Request ID !');
    }
  }
  static toJSON(mfaSchema: string): MFASchemaValueObject {
    const jsonParse = JSON.parse(mfaSchema);
    if (!jsonParse.userId || !jsonParse.email || !jsonParse.oauthRequestId) {
      throw OauthDomainError.internalServerError('Invalid parse MFA Schema ! ');
    }
    return new MFASchemaValueObject(jsonParse);
  }
  toStringify(): string {
    return JSON.stringify(this.mfaSchemaProps);
  }
}
