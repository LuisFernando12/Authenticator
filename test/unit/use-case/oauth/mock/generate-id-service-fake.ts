import { GenerateIdServicePort } from '../../../../../src/oauth/application/port/generate-id-service.port';

export class GenerateIdServiceFake implements GenerateIdServicePort {
  generateOauthRequestId(): string {
    return 'test-oauth-request-id';
  }
  generateOauthAuthorizationCode(): string {
    return 'test-oauth-authorization-code';
  }
  generateMFAChallengeId(): string {
    return 'test-mfa-challenge-id';
  }
}
