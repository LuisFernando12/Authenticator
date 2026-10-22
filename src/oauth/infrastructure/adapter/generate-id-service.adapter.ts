import * as crypto from 'node:crypto';
import { GenerateIdServicePort } from '../../application/port/generate-id-service.port';

export class GenerateIdServiceAdapter implements GenerateIdServicePort {
  generateOauthRequestId(): string {
    const oauthRequestID = crypto
      .createHash('sha256')
      .update(crypto.randomBytes(16).toString('hex'))
      .digest('base64url');
    return oauthRequestID;
  }
  generateOauthAuthorizationCode(): string {
    return crypto
      .createHash('sha256')
      .update(crypto.randomBytes(32))
      .digest('base64url');
  }
  generateMFAChallengeId(): string {
    return crypto.randomUUID();
  }
}
